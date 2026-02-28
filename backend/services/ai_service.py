import os
import httpx
import asyncio
from flask import current_app

class AIService:
    def __init__(self):
        self.groq_key = os.getenv('GROQ_API_KEY')
        self.gemini_key = os.getenv('GEMINI_API_KEY')
        self.default_model = "llama3-8b-8192"
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"

    async def get_response_async(self, message, history=None, provider='groq'):
        """Asynchronous call to AI API with provider choice"""
        if provider == 'gemini' and self.gemini_key:
            return await self._get_gemini_response(message, history)
        
        if self.groq_key:
            return await self._get_groq_response(message, history)
        
        return "AI service is currently unavailable (Missing API Keys)."

    async def _get_groq_response(self, message, history=None):
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }
        messages = history if history else []
        messages.append({"role": "user", "content": message})
        
        payload = {
            "model": self.default_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self.groq_url, headers=headers, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data['choices'][0]['message']['content']
        except Exception as e:
            current_app.logger.error(f"Groq API Error: {str(e)}")
            return self._fallback_response()

    async def _get_gemini_response(self, message, history=None):
        # Implementation for Gemini via HTTP (simplified)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.gemini_key}"
        headers = {"Content-Type": "application/json"}
        
        contents = []
        if history:
            for m in history:
                role = "user" if m['role'] == 'user' else "model"
                contents.append({"role": role, "parts": [{"text": m['content']}]})
        contents.append({"role": "user", "parts": [{"text": message}]})
        
        payload = {"contents": contents}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            current_app.logger.error(f"Gemini API Error: {str(e)}")
            return self._fallback_response()

    def _fallback_response(self):
        return "I'm having trouble connecting to my brain right now. Please try again later!"

    def get_response(self, message, history=None, provider='groq'):
        """Synchronous wrapper for async call"""
        try:
            # Check if an event loop is already running
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # In Flask, we might need a separate thread or use a synchronous library
                # For simplicity, we'll try to run in a temporary executor if needed
                # But typically Flask handles this in a worker thread.
                return loop.run_until_complete(self.get_response_async(message, history, provider))
            else:
                return asyncio.run(self.get_response_async(message, history, provider))
        except Exception as e:
            current_app.logger.error(f"Sync AI call Error: {str(e)}")
            # Last resort: new loop
            new_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(new_loop)
            return new_loop.run_until_complete(self.get_response_async(message, history, provider))
