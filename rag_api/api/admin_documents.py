from flask import Blueprint, request, jsonify
import logging
import os
import datetime
import uuid
from werkzeug.utils import secure_filename
from api.admin_auth import admin_required
from core.data_processor import DataProcessor
from core.embedding_model import get_embedding_model
import json
import shutil

# Cấu hình logging
logger = logging.getLogger(__name__)

# Tạo blueprint
admin_documents_routes = Blueprint('admin_documents', __name__)

# Cấu hình upload
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'md', 'docx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Tạo thư mục uploads nếu chưa có
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Kiểm tra file có được phép upload không"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@admin_documents_routes.route('/documents', methods=['GET'])
@admin_required(resource="documents", action="read")
def get_all_documents():
    """API endpoint để lấy danh sách tất cả tài liệu"""
    try:
        # Lấy thông tin từ DataProcessor
        data_processor = DataProcessor()
        all_metadata = data_processor.get_all_metadata()
        all_items = data_processor.get_all_items()
        
        documents = []
        
        # Xử lý metadata từ các bài học và phụ lục
        for doc_id, metadata in all_metadata.items():
            doc_info = {
                "id": doc_id,
                "type": "lesson" if "bai_info" in metadata else "appendix",
                "created_at": datetime.datetime.now().isoformat(),  # Placeholder
                "status": "processed"
            }
            
            # Thông tin bài học
            if "bai_info" in metadata:
                bai_info = metadata["bai_info"]
                doc_info.update({
                    "title": bai_info.get("title", doc_id),
                    "description": bai_info.get("description", ""),
                    "author": bai_info.get("author", ""),
                    "subject": bai_info.get("subject", ""),
                    "grade": bai_info.get("grade", ""),
                    "age_range": bai_info.get("age_range", [])
                })
            
            # Thông tin phụ lục
            elif "phuluc_info" in metadata:
                phuluc_info = metadata["phuluc_info"]
                doc_info.update({
                    "title": phuluc_info.get("title", doc_id),
                    "description": phuluc_info.get("description", ""),
                    "content_type": phuluc_info.get("content_type", ""),
                    "data_source": phuluc_info.get("data_source", "")
                })
            
            # Thống kê nội dung
            doc_info["content_stats"] = {
                "chunks": len(metadata.get("chunks", [])),
                "tables": len(metadata.get("tables", [])),
                "figures": len(metadata.get("figures", [])),
                "data_files": len(metadata.get("data_files", []))
            }
            
            documents.append(doc_info)
        
        # Lấy danh sách files uploaded
        uploaded_files = []
        if os.path.exists(UPLOAD_FOLDER):
            for filename in os.listdir(UPLOAD_FOLDER):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    uploaded_files.append({
                        "id": f"upload_{filename}",
                        "title": filename,
                        "type": "uploaded",
                        "file_size": stat.st_size,
                        "created_at": datetime.datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "status": "uploaded",
                        "file_path": file_path
                    })
        
        # Kết hợp tất cả documents
        all_documents = documents + uploaded_files
        
        return jsonify({
            "success": True,
            "documents": all_documents,
            "total": len(all_documents),
            "stats": {
                "processed": len(documents),
                "uploaded": len(uploaded_files),
                "total_chunks": sum(doc.get("content_stats", {}).get("chunks", 0) for doc in documents),
                "total_tables": sum(doc.get("content_stats", {}).get("tables", 0) for doc in documents),
                "total_figures": sum(doc.get("content_stats", {}).get("figures", 0) for doc in documents)
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy danh sách documents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/<doc_id>', methods=['GET'])
@admin_required(resource="documents", action="read")
def get_document_detail(doc_id):
    """API endpoint để lấy chi tiết một tài liệu"""
    try:
        data_processor = DataProcessor()
        
        # Nếu là uploaded file
        if doc_id.startswith("upload_"):
            filename = doc_id.replace("upload_", "")
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            
            if os.path.exists(file_path):
                stat = os.stat(file_path)
                return jsonify({
                    "success": True,
                    "document": {
                        "id": doc_id,
                        "title": filename,
                        "type": "uploaded",
                        "file_size": stat.st_size,
                        "file_path": file_path,
                        "created_at": datetime.datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified_at": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "status": "uploaded",
                        "extension": filename.split('.')[-1] if '.' in filename else ""
                    }
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "File không tồn tại"
                }), 404
        
        # Nếu là processed document
        all_metadata = data_processor.get_all_metadata()
        
        if doc_id not in all_metadata:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy tài liệu"
            }), 404
        
        metadata = all_metadata[doc_id]
        all_items = data_processor.get_all_items()
        
        # Lấy chi tiết chunks, tables, figures
        document_chunks = [chunk for chunk in all_items["chunks"] if chunk.get("id", "").startswith(doc_id)]
        document_tables = [table for table in all_items["tables"] if table.get("id", "").startswith(doc_id)]
        document_figures = [figure for figure in all_items["figures"] if figure.get("id", "").startswith(doc_id)]
        
        document_detail = {
            "id": doc_id,
            "metadata": metadata,
            "content": {
                "chunks": document_chunks,
                "tables": document_tables,
                "figures": document_figures
            },
            "stats": {
                "total_chunks": len(document_chunks),
                "total_tables": len(document_tables),
                "total_figures": len(document_figures),
                "total_words": sum(chunk.get("word_count", 0) for chunk in document_chunks),
                "total_tokens": sum(chunk.get("token_count", 0) for chunk in document_chunks)
            }
        }
        
        return jsonify({
            "success": True,
            "document": document_detail
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy chi tiết document: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/upload', methods=['POST'])
@admin_required(resource="documents", action="write")
def upload_document():
    """API endpoint để upload tài liệu"""
    try:
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "Không có file được upload"
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "Không có file được chọn"
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": f"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # Kiểm tra kích thước file
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                "success": False,
                "error": f"File quá lớn. Kích thước tối đa: {MAX_FILE_SIZE // (1024*1024)}MB"
            }), 400
        
        # Tạo tên file unique
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Lưu file
        file.save(file_path)
        
        # Lấy metadata từ form nếu có
        title = request.form.get('title', filename)
        description = request.form.get('description', '')
        author = request.form.get('author', '')
        
        # Tạo metadata file
        metadata = {
            "original_filename": filename,
            "unique_filename": unique_filename,
            "title": title,
            "description": description,
            "author": author,
            "file_size": file_size,
            "uploaded_at": datetime.datetime.now().isoformat(),
            "status": "uploaded",
            "processed": False
        }
        
        metadata_path = os.path.join(UPLOAD_FOLDER, f"{unique_filename}.metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            "success": True,
            "message": "Upload file thành công",
            "file_info": {
                "id": f"upload_{unique_filename}",
                "original_filename": filename,
                "unique_filename": unique_filename,
                "file_size": file_size,
                "title": title,
                "file_path": file_path
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi upload file: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/<doc_id>/process', methods=['POST'])
@admin_required(resource="documents", action="write")
def process_document(doc_id):
    """API endpoint để xử lý tài liệu thành chunks và embedding"""
    try:
        # Kiểm tra đây có phải là uploaded file không
        if not doc_id.startswith("upload_"):
            return jsonify({
                "success": False,
                "error": "Chỉ có thể xử lý các file đã upload"
            }), 400
        
        unique_filename = doc_id.replace("upload_", "")
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        metadata_path = os.path.join(UPLOAD_FOLDER, f"{unique_filename}.metadata.json")
        
        if not os.path.exists(file_path):
            return jsonify({
                "success": False,
                "error": "File không tồn tại"
            }), 404
        
        # Đọc metadata
        metadata = {}
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        
        # Lấy parameters từ request
        data = request.json or {}
        processing_options = {
            "chunk_size": data.get("chunk_size", 1000),
            "chunk_overlap": data.get("chunk_overlap", 200),
            "age_range": data.get("age_range", [1, 19]),
            "create_embeddings": data.get("create_embeddings", True)
        }
        
        # TODO: Implement document processing logic
        # Đây là nơi bạn sẽ:
        # 1. Đọc nội dung file (PDF, DOCX, TXT, MD)
        # 2. Chia thành chunks
        # 3. Tạo embeddings
        # 4. Lưu vào database/vector store
        
        # Placeholder implementation
        processed_data = {
            "chunks_created": 0,
            "embeddings_created": 0,
            "processing_time": 0.0
        }
        
        # Cập nhật metadata
        metadata.update({
            "processed": True,
            "processed_at": datetime.datetime.now().isoformat(),
            "processing_options": processing_options,
            "processing_results": processed_data,
            "status": "processed"
        })
        
        # Lưu metadata đã cập nhật
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            "success": True,
            "message": "Xử lý tài liệu thành công",
            "processing_results": processed_data
        })
        
    except Exception as e:
        logger.error(f"Lỗi xử lý document: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/<doc_id>', methods=['DELETE'])
@admin_required(resource="documents", action="delete")
def delete_document(doc_id):
    """API endpoint để xóa tài liệu"""
    try:
        # Nếu là uploaded file
        if doc_id.startswith("upload_"):
            unique_filename = doc_id.replace("upload_", "")
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            metadata_path = os.path.join(UPLOAD_FOLDER, f"{unique_filename}.metadata.json")
            
            files_deleted = []
            
            # Xóa file chính
            if os.path.exists(file_path):
                os.remove(file_path)
                files_deleted.append(file_path)
            
            # Xóa metadata
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
                files_deleted.append(metadata_path)
            
            if files_deleted:
                return jsonify({
                    "success": True,
                    "message": f"Đã xóa {len(files_deleted)} file(s)",
                    "deleted_files": files_deleted
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "File không tồn tại"
                }), 404
        
        # Nếu là processed document trong data folder
        else:
            data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "data")
            doc_folder = os.path.join(data_dir, doc_id)
            
            if os.path.exists(doc_folder):
                # Xóa thư mục và tất cả nội dung
                shutil.rmtree(doc_folder)
                
                # TODO: Xóa embeddings từ vector database
                try:
                    embedding_model = get_embedding_model()
                    # Xóa tất cả embeddings có prefix doc_id
                    # embedding_model.delete_by_prefix(doc_id)
                except Exception as e:
                    logger.warning(f"Không thể xóa embeddings: {e}")
                
                return jsonify({
                    "success": True,
                    "message": f"Đã xóa tài liệu {doc_id} và tất cả dữ liệu liên quan"
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "Tài liệu không tồn tại"
                }), 404
        
    except Exception as e:
        logger.error(f"Lỗi xóa document: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/bulk-delete', methods=['POST'])
@admin_required(resource="documents", action="delete")
def bulk_delete_documents():
    """API endpoint để xóa nhiều tài liệu cùng lúc"""
    try:
        data = request.json
        doc_ids = data.get('doc_ids', [])
        
        if not doc_ids:
            return jsonify({
                "success": False,
                "error": "Không có tài liệu nào được chọn"
            }), 400
        
        deleted_count = 0
        failed_ids = []
        deleted_details = []
        
        for doc_id in doc_ids:
            try:
                if doc_id.startswith("upload_"):
                    # Xóa uploaded file
                    unique_filename = doc_id.replace("upload_", "")
                    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                    metadata_path = os.path.join(UPLOAD_FOLDER, f"{unique_filename}.metadata.json")
                    
                    files_removed = []
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        files_removed.append(file_path)
                    if os.path.exists(metadata_path):
                        os.remove(metadata_path)
                        files_removed.append(metadata_path)
                    
                    if files_removed:
                        deleted_count += 1
                        deleted_details.append({
                            "id": doc_id,
                            "type": "uploaded",
                            "files_removed": files_removed
                        })
                    else:
                        failed_ids.append(doc_id)
                
                else:
                    # Xóa processed document
                    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "data")
                    doc_folder = os.path.join(data_dir, doc_id)
                    
                    if os.path.exists(doc_folder):
                        shutil.rmtree(doc_folder)
                        deleted_count += 1
                        deleted_details.append({
                            "id": doc_id,
                            "type": "processed",
                            "folder_removed": doc_folder
                        })
                    else:
                        failed_ids.append(doc_id)
                        
            except Exception as e:
                logger.error(f"Lỗi xóa document {doc_id}: {e}")
                failed_ids.append(doc_id)
        
        return jsonify({
            "success": True,
            "message": f"Đã xóa {deleted_count}/{len(doc_ids)} tài liệu",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids,
            "details": deleted_details
        })
        
    except Exception as e:
        logger.error(f"Lỗi xóa bulk documents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/embeddings/rebuild', methods=['POST'])
@admin_required(resource="documents", action="write")
def rebuild_embeddings():
    """API endpoint để rebuild lại tất cả embeddings"""
    try:
        force_rebuild = request.json.get('force', False) if request.json else False
        
        # Import embedding script
        import sys
        script_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts")
        sys.path.append(script_dir)
        
        try:
            from embed_data import embed_all_data
            
            # Đường dẫn đến thư mục data
            data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "data")
            
            # Chạy embedding process
            embed_all_data(data_dir, force=force_rebuild)
            
            # Lấy thống kê sau khi embedding
            embedding_model = get_embedding_model()
            total_embeddings = embedding_model.count()
            
            return jsonify({
                "success": True,
                "message": "Rebuild embeddings thành công",
                "total_embeddings": total_embeddings,
                "force_rebuild": force_rebuild
            })
            
        except ImportError:
            return jsonify({
                "success": False,
                "error": "Không thể import embedding script"
            }), 500
        
    except Exception as e:
        logger.error(f"Lỗi rebuild embeddings: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/embeddings/stats', methods=['GET'])
@admin_required(resource="documents", action="read")
def get_embeddings_stats():
    """API endpoint để lấy thống kê embeddings"""
    try:
        embedding_model = get_embedding_model()
        total_embeddings = embedding_model.count()
        
        # Lấy thống kê chi tiết từ DataProcessor
        data_processor = DataProcessor()
        data_stats = data_processor.get_stats()
        
        return jsonify({
            "success": True,
            "stats": {
                "total_embeddings": total_embeddings,
                "data_items": data_stats,
                "embedding_model": "intfloat/multilingual-e5-base",
                "vector_dimension": 768,  # Dimension của multilingual-e5-base
                "collection_name": "nutrition_data"
            }
        })
        
    except Exception as e:
        logger.error(f"Lỗi lấy thống kê embeddings: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/search', methods=['GET'])
@admin_required(resource="documents", action="read")
def search_documents():
    """API endpoint để tìm kiếm tài liệu"""
    try:
        query = request.args.get('q', '')
        doc_type = request.args.get('type', 'all')  # all, lesson, appendix, uploaded
        limit = int(request.args.get('limit', 50))
        
        if not query:
            return jsonify({
                "success": False,
                "error": "Cần nhập từ khóa tìm kiếm"
            }), 400
        
        data_processor = DataProcessor()
        results = []
        
        # Tìm kiếm trong processed documents
        if doc_type in ['all', 'lesson', 'appendix']:
            all_metadata = data_processor.get_all_metadata()
            
            for doc_id, metadata in all_metadata.items():
                doc_title = ""
                doc_description = ""
                current_type = ""
                
                if "bai_info" in metadata:
                    current_type = "lesson"
                    bai_info = metadata["bai_info"]
                    doc_title = bai_info.get("title", "")
                    doc_description = bai_info.get("description", "")
                elif "phuluc_info" in metadata:
                    current_type = "appendix"
                    phuluc_info = metadata["phuluc_info"]
                    doc_title = phuluc_info.get("title", "")
                    doc_description = phuluc_info.get("description", "")
                
                # Kiểm tra type filter
                if doc_type != 'all' and current_type != doc_type:
                    continue
                
                # Tìm kiếm trong title và description
                search_text = f"{doc_title} {doc_description}".lower()
                if query.lower() in search_text:
                    results.append({
                        "id": doc_id,
                        "title": doc_title,
                        "description": doc_description,
                        "type": current_type,
                        "relevance": search_text.count(query.lower()),
                        "content_stats": {
                            "chunks": len(metadata.get("chunks", [])),
                            "tables": len(metadata.get("tables", [])),
                            "figures": len(metadata.get("figures", []))
                        }
                    })
        
        # Tìm kiếm trong uploaded files
        if doc_type in ['all', 'uploaded']:
            if os.path.exists(UPLOAD_FOLDER):
                for filename in os.listdir(UPLOAD_FOLDER):
                    if filename.endswith('.metadata.json'):
                        continue
                    
                    if query.lower() in filename.lower():
                        metadata_path = os.path.join(UPLOAD_FOLDER, f"{filename}.metadata.json")
                        file_metadata = {}
                        
                        if os.path.exists(metadata_path):
                            try:
                                with open(metadata_path, 'r', encoding='utf-8') as f:
                                    file_metadata = json.load(f)
                            except:
                                pass
                        
                        file_path = os.path.join(UPLOAD_FOLDER, filename)
                        stat = os.stat(file_path)
                        
                        results.append({
                            "id": f"upload_{filename}",
                            "title": file_metadata.get("title", filename),
                            "description": file_metadata.get("description", ""),
                            "type": "uploaded",
                            "relevance": filename.lower().count(query.lower()),
                            "file_size": stat.st_size,
                            "uploaded_at": file_metadata.get("uploaded_at"),
                            "processed": file_metadata.get("processed", False)
                        })
        
        # Sắp xếp theo độ liên quan
        results.sort(key=lambda x: x.get("relevance", 0), reverse=True)
        results = results[:limit]
        
        return jsonify({
            "success": True,
            "results": results,
            "total_found": len(results),
            "query": query,
            "type_filter": doc_type
        })
        
    except Exception as e:
        logger.error(f"Lỗi tìm kiếm documents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@admin_documents_routes.route('/documents/export', methods=['GET'])
@admin_required(resource="documents", action="read")
def export_documents_list():
    """API endpoint để xuất danh sách tài liệu"""
    try:
        format_type = request.args.get('format', 'json')  # json hoặc csv
        
        data_processor = DataProcessor()
        all_metadata = data_processor.get_all_metadata()
        
        documents_list = []
        
        for doc_id, metadata in all_metadata.items():
            doc_info = {
                "id": doc_id,
                "type": "lesson" if "bai_info" in metadata else "appendix"
            }
            
            if "bai_info" in metadata:
                bai_info = metadata["bai_info"]
                doc_info.update({
                    "title": bai_info.get("title", ""),
                    "description": bai_info.get("description", ""),
                    "author": bai_info.get("author", ""),
                    "subject": bai_info.get("subject", ""),
                    "grade": bai_info.get("grade", ""),
                    "age_range": str(bai_info.get("age_range", []))
                })
            elif "phuluc_info" in metadata:
                phuluc_info = metadata["phuluc_info"]
                doc_info.update({
                    "title": phuluc_info.get("title", ""),
                    "description": phuluc_info.get("description", ""),
                    "content_type": phuluc_info.get("content_type", ""),
                    "data_source": phuluc_info.get("data_source", ""),
                    "author": "",
                    "subject": "",
                    "grade": "",
                    "age_range": ""
                })
            
            doc_info.update({
                "chunks_count": len(metadata.get("chunks", [])),
                "tables_count": len(metadata.get("tables", [])),
                "figures_count": len(metadata.get("figures", []))
            })
            
            documents_list.append(doc_info)
        
        if format_type == 'csv':
            import csv
            from io import StringIO
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Headers
            headers = ['ID', 'Tiêu đề', 'Mô tả', 'Loại', 'Tác giả', 'Môn học', 'Lớp', 'Độ tuổi', 'Chunks', 'Bảng', 'Hình']
            writer.writerow(headers)
            
            # Data rows
            for doc in documents_list:
                writer.writerow([
                    doc.get('id', ''),
                    doc.get('title', ''),
                    doc.get('description', ''),
                    doc.get('type', ''),
                    doc.get('author', ''),
                    doc.get('subject', ''),
                    doc.get('grade', ''),
                    doc.get('age_range', ''),
                    doc.get('chunks_count', 0),
                    doc.get('tables_count', 0),
                    doc.get('figures_count', 0)
                ])
            
            output.seek(0)
            
            from flask import Response
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-disposition": "attachment; filename=documents_export.csv"}
            )
        
        else:  # JSON format
            return jsonify({
                "success": True,
                "documents": documents_list,
                "exported_at": datetime.datetime.now().isoformat(),
                "total_documents": len(documents_list)
            })
        
    except Exception as e:
        logger.error(f"Lỗi export documents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500