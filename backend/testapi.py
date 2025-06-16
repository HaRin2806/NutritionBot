from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
client = OpenAI(
api_key = OPENAI_API_KEY
)
completion = client.chat.completions.create(
  model="gpt-4o-mini",
  store=True,
  messages=[
    {"role": "user", "content": "What is the capital of Vietnam?"}
  ]
)

print(completion.choices[0].message)