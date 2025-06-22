import os
import datetime
from pymongo import MongoClient, DESCENDING
from bson.objectid import ObjectId
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

# Sử dụng cùng DB connection như user_model
from models.user_model import get_db

class Feedback:
    def __init__(self, user_id=None, rating=5, category="general", title="", 
                 content="", status="pending", admin_response="", 
                 feedback_id=None, created_at=None, updated_at=None):
        self.feedback_id = feedback_id
        self.user_id = user_id
        self.rating = rating  # 1-5 stars
        self.category = category  # "tư vấn", "giao diện", "tính năng", "khác"
        self.title = title
        self.content = content
        self.status = status  # "pending", "reviewed", "resolved"
        self.admin_response = admin_response
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()

    def to_dict(self):
        """Convert feedback object to dictionary"""
        feedback_dict = {
            "user_id": self.user_id,
            "rating": self.rating,
            "category": self.category,
            "title": self.title,
            "content": self.content,
            "status": self.status,
            "admin_response": self.admin_response,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        if self.feedback_id:
            feedback_dict["_id"] = self.feedback_id
        return feedback_dict

    @classmethod
    def from_dict(cls, feedback_dict):
        """Create Feedback object from dictionary"""
        if not feedback_dict:
            return None
        return cls(
            feedback_id=feedback_dict.get("_id"),
            user_id=feedback_dict.get("user_id"),
            rating=feedback_dict.get("rating", 5),
            category=feedback_dict.get("category", "general"),
            title=feedback_dict.get("title", ""),
            content=feedback_dict.get("content", ""),
            status=feedback_dict.get("status", "pending"),
            admin_response=feedback_dict.get("admin_response", ""),
            created_at=feedback_dict.get("created_at"),
            updated_at=feedback_dict.get("updated_at")
        )

    def save(self):
        """Save feedback to database"""
        try:
            db = get_db()
            feedbacks_collection = db.feedbacks
            
            self.updated_at = datetime.datetime.now()
            
            if not self.feedback_id:
                # New feedback
                insert_result = feedbacks_collection.insert_one(self.to_dict())
                self.feedback_id = insert_result.inserted_id
                logger.info(f"Created new feedback: {self.feedback_id}")
                return self.feedback_id
            else:
                # Update existing feedback
                feedbacks_collection.update_one(
                    {"_id": self.feedback_id}, 
                    {"$set": self.to_dict()}
                )
                logger.info(f"Updated feedback: {self.feedback_id}")
                return self.feedback_id
        except Exception as e:
            logger.error(f"Error saving feedback: {e}")
            raise

    @classmethod
    def create(cls, user_id, rating, category, title, content):
        """Create new feedback"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            feedback = cls(
                user_id=user_id,
                rating=rating,
                category=category,
                title=title,
                content=content
            )
            
            feedback_id = feedback.save()
            logger.info(f"Created feedback: {feedback_id}")
            return feedback_id
        except Exception as e:
            logger.error(f"Error creating feedback: {e}")
            raise

    @classmethod
    def find_by_user(cls, user_id, limit=10, skip=0):
        """Get user's feedback"""
        try:
            db = get_db()
            feedbacks_collection = db.feedbacks
            
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            feedbacks_cursor = feedbacks_collection.find({"user_id": user_id})\
                .sort("created_at", DESCENDING)\
                .skip(skip)\
                .limit(limit)
            
            return [cls.from_dict(feedback) for feedback in feedbacks_cursor]
        except Exception as e:
            logger.error(f"Error finding feedback by user: {e}")
            return []

    @classmethod
    def find_by_id(cls, feedback_id):
        """Find feedback by ID"""
        try:
            db = get_db()
            feedbacks_collection = db.feedbacks
            
            if isinstance(feedback_id, str):
                feedback_id = ObjectId(feedback_id)
                
            feedback_dict = feedbacks_collection.find_one({"_id": feedback_id})
            return cls.from_dict(feedback_dict)
        except Exception as e:
            logger.error(f"Error finding feedback by ID: {e}")
            return None

    @classmethod
    def get_all_for_admin(cls, limit=50, skip=0, status_filter=None):
        """Get all feedback for admin dashboard"""
        try:
            db = get_db()
            feedbacks_collection = db.feedbacks
            
            query = {}
            if status_filter:
                query["status"] = status_filter
            
            feedbacks_cursor = feedbacks_collection.find(query)\
                .sort("created_at", DESCENDING)\
                .skip(skip)\
                .limit(limit)
            
            feedbacks = []
            for feedback_dict in feedbacks_cursor:
                feedback = cls.from_dict(feedback_dict)
                if feedback:
                    # Get user info
                    from models.user_model import User
                    user = User.find_by_id(feedback.user_id)
                    feedback.user_name = user.name if user else "Người dùng ẩn danh"
                    feedback.user_email = user.email if user else ""
                    feedbacks.append(feedback)
            
            return feedbacks
        except Exception as e:
            logger.error(f"Error getting feedback for admin: {e}")
            return []

    @classmethod
    def get_stats(cls):
        """Get feedback statistics"""
        try:
            db = get_db()
            feedbacks_collection = db.feedbacks
            
            total = feedbacks_collection.count_documents({})
            pending = feedbacks_collection.count_documents({"status": "pending"})
            reviewed = feedbacks_collection.count_documents({"status": "reviewed"})
            resolved = feedbacks_collection.count_documents({"status": "resolved"})
            
            # Average rating
            pipeline = [
                {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
            ]
            avg_result = list(feedbacks_collection.aggregate(pipeline))
            avg_rating = round(avg_result[0]["avg_rating"], 1) if avg_result else 0
            
            # Rating distribution
            rating_pipeline = [
                {"$group": {"_id": "$rating", "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            rating_distribution = list(feedbacks_collection.aggregate(rating_pipeline))
            
            return {
                "total_feedback": total,
                "pending_feedback": pending,
                "reviewed_feedback": reviewed,
                "resolved_feedback": resolved,
                "average_rating": avg_rating,
                "rating_distribution": rating_distribution
            }
        except Exception as e:
            logger.error(f"Error getting feedback stats: {e}")
            return {
                "total_feedback": 0,
                "pending_feedback": 0,
                "reviewed_feedback": 0,
                "resolved_feedback": 0,
                "average_rating": 0,
                "rating_distribution": []
            }

    def update_admin_response(self, response, status="reviewed"):
        """Update admin response and status"""
        try:
            self.admin_response = response
            self.status = status
            self.save()
            return True
        except Exception as e:
            logger.error(f"Error updating admin response: {e}")
            return False

def ensure_indexes():
    """Đảm bảo các indexes cần thiết được tạo"""
    try:
        db = get_db()
        feedbacks_collection = db.feedbacks
        
        # Tạo các indexes
        feedbacks_collection.create_index("user_id")
        feedbacks_collection.create_index([("created_at", -1)])
        feedbacks_collection.create_index("status")
        feedbacks_collection.create_index([("user_id", 1), ("created_at", -1)])
        feedbacks_collection.create_index("category")
        
        logger.info("Đã tạo indexes cho feedbacks collection")
        return True
    except Exception as e:
        logger.error(f"Lỗi tạo indexes: {e}")
        return False