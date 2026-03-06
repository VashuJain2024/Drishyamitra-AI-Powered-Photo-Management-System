import os
import json
import logging
from groq import Groq
from services.chat_actions import ACTION_MAP

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

        self.system_prompt = """
You are Drishyamitra, an intelligent AI assistant for photo management.
Your goal is to help users manage their photos and share them.

### INTENT TRIGGERING RULES:
1. If the user wants to perform an action (share, find, list, stats), you MUST respond with a JSON object ONLY.
2. Format: {"intent": "intent_name", "params": {"key": "value"}}
3. Do NOT include any conversational text before or after the JSON.

### AVAILABLE INTENTS:
- get_deliveries: params={"days": int}
- find_photos: params={"name": str}
- list_persons: params={}
- get_stats: params={}
- share_photo: params={"photo_id": int, "recipient": str, "body": str}

### FEW-SHOT EXAMPLES:
User: "show my recent deliveries"
Assistant: {"intent": "get_deliveries", "params": {"days": 7}}

User: "find photos of Rahul"
Assistant: {"intent": "find_photos", "params": {"name": "Rahul"}}

User: "share photo 5 with test@gmail.com"
Assistant: {"intent": "share_photo", "params": {"photo_id": 5, "recipient": "test@gmail.com"}}

User: "email photo 2 to rahul@gmail.com with the message 'Happy Birthday!'"
Assistant: {"intent": "share_photo", "params": {"photo_id": 2, "recipient": "rahul@gmail.com", "body": "Happy Birthday!"}}

User: "hello"
Assistant: "Hello! I am Drishyamitra, your AI photo assistant. How can I help you today?"

### CONVERSATIONAL RULES:
- Use conversation ONLY if no intent matches or if information is missing.
- If missing photo_id for sharing, ask: "Which photo ID would you like to share?"
- NEVER mention "JSON" or "intents" to the user.
"""

    def _generate_final_response(self, user_query, action_result):
        messages = [
            {
                "role": "system",
                "content": "Summarize this database result in a friendly way."
            },
            {
                "role": "user",
                "content": f"Query: {user_query}\nData: {action_result}"
            }
        ]

        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=512
            )

            content = completion.choices[0].message.content or ""
            return content.strip()

        except Exception:
            return f"I've updated your information: {action_result}"

    def _mock_fallback(self, message, user_id):
        return "Mock AI: No valid GROQ_API_KEY configured."

    def get_response(self, message, history=None, user_id=None):
        """
        Main synchronous Groq execution method
        """

        api_key = os.environ.get("GROQ_API_KEY")

        if not api_key or api_key == "your_actual_groq_api_key_here":
            return self._mock_fallback(message, user_id)

        messages = [
            {"role": "system", "content": self.system_prompt}
        ]

        if history:
            for msg in history:
                role = msg.get("role", "user")
                content = msg.get("content", "")

                if role == "bot":
                    role = "assistant"

                if role not in ["system", "user", "assistant"]:
                    role = "user"

                if content:
                    messages.append({
                        "role": role,
                        "content": content
                    })

        messages.append({
            "role": "user",
            "content": message
        })

        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=512
            )

            ai_content = completion.choices[0].message.content or ""
            ai_content = ai_content.strip()

            try:
                import re

                json_match = re.search(r'\{.*"intent".*\}', ai_content, re.DOTALL)

                if json_match:
                    cleaned = json_match.group(0)
                    intent_data = json.loads(cleaned)

                    if isinstance(intent_data, dict) and "intent" in intent_data:
                        intent_name = intent_data.get("intent")
                        params = intent_data.get("params", {})
                        params["user_id"] = user_id

                        if intent_name in ACTION_MAP:
                            action_result = ACTION_MAP[intent_name](params)
                            summary = self._generate_final_response(message, action_result.get("text", str(action_result)))
                            return {
                                "response": summary,
                                "data": action_result.get("data")
                            }
            except Exception as e:
                logger.warning(f"Intent parsing failed: {e}")
                pass

            return ai_content

        except Exception as e:
            logger.error(f"Groq API Error: {str(e)}")
            return f"Failed to generate AI response: {str(e)}"