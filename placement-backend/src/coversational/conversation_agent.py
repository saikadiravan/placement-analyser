import json
import requests
from fastapi import HTTPException
from pathlib import Path

# Import your data directory path helper
import chromadb
from src.utils.paths import DATA_DIR
CHROMA_DB_DIR = DATA_DIR / "chroma_db"

# ─────────────────────────────────────────────
# AI MODEL CONFIGURATION
# ─────────────────────────────────────────────
# Default Ollama local endpoint
OLLAMA_URL = "http://localhost:11434/api/generate"
# Change this to your installed model (e.g., "llama3", "mistral")
OLLAMA_MODEL = "llama3:latest"

# ─────────────────────────────────────────────
# DATABASE CONFIGURATION
# ─────────────────────────────────────────────
# Point to your existing chroma.sqlite3 database directory
CHROMA_DB_DIR = DATA_DIR / "chroma_db"

def _company_slug(company: str) -> str:
    return company.lower().replace(" ", "_").replace(".", "")

def chat_with_insights(company: str, user_query: str) -> dict:
    print(f"\n[Conversation Agent] Searching database insights for {company}...")
    safe_company = company.lower().replace(" ", "_").replace(".", "")

    try:
        # Query local ChromaDB instead of raw JSON
        client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
        collection = client.get_or_create_collection(name=safe_company)
        
         # Search the database for the most relevant context to the user's query
        results = collection.query(
            query_texts=[user_query],
            n_results=3
        )
        
        # Extract the inner list at index zero
        if results and results.get("documents") and results["documents"][ 0 ]:
            context_text = " ".join(results["documents"][ 0 ])
        else:
            context_text = f"No specific interview data found in the database for {company}."
            
    except Exception as e:
        print(f"[Warning] Database query failed: {str(e)}")
        context_text = "Database connection error. Proceeding with general knowledge."

    system_prompt = (
        f"You are an expert technical career coach. Use the following extracted interview "
        f"insights for {company} to answer the user's question accurately.\n\n"
        f"Context:\n{context_text}"
    )
    
    final_prompt = f"{system_prompt}\n\nUser Question: {user_query}\nAnswer:"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": final_prompt,
        "stream": False
    }
    
    response = requests.post(OLLAMA_URL, json=payload, timeout=80)
    response.raise_for_status()
    data = response.json()
    
    return {"reply": data.get("response", "")}

# ─────────────────────────────────────────────
# ISOLATED TESTING BLOCK
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # Test the Conversational Agent locally in your terminal!
    print("🤖 PlacementPrep AI Chatbot (Powered by Ollama + ChromaDB)")
    target_company = input("Enter company to query (e.g., Amazon, Deloitte): ").strip() or "Amazon"
    test_query = input(f"What do you want to ask about {target_company}? ") or "What are the common DSA topics?"
    
    try:
        res = chat_with_insights(target_company, test_query)
        print(f"\nResponse:\n{res['reply']}")
    except Exception as err:
        print(f"\nTest Failed: {err}")