import os
import json
import shutil
from typing import Dict, List, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "data_store.json")

# In-memory document store schema
store: Dict[str, List[Any]] = {
    "users": [],
    "expenses": [],
    "group_splits": [],
    "subscriptions": [],
    "financial_goals": [],
    "credit_cards": [],
    "payments": []
}

def load_store():
    global store
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for key in store.keys():
                    if key in data and isinstance(data[key], list):
                        store[key] = data[key]
        except Exception as e:
            print(f"[DATABASE ENGINE ERROR] Failed to load data_store.json: {e}")

def persist_store():
    try:
        tmp_file = f"{DB_FILE}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=2)
        shutil.move(tmp_file, DB_FILE)
    except Exception as e:
        print(f"[DATABASE ENGINE ERROR] Atomic save failed: {e}")

# Initialize database at startup
load_store()

# Query Helper Functions
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    clean_email = email.strip().lower()
    for user in store["users"]:
        if user.get("email", "").strip().lower() == clean_email:
            return user
    return None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    for user in store["users"]:
        if user.get("id") == user_id:
            return user
    return None

def get_expenses_by_user(user_id: int) -> List[Dict[str, Any]]:
    return [e for e in store["expenses"] if e.get("user_id") == user_id]

def add_expense(expense_data: Dict[str, Any]) -> Dict[str, Any]:
    new_id = max([e.get("id", 0) for e in store["expenses"]], default=0) + 1
    expense_data["id"] = new_id
    store["expenses"].append(expense_data)
    persist_store()
    return expense_data

def delete_expense(expense_id: int, user_id: int) -> bool:
    initial_len = len(store["expenses"])
    store["expenses"] = [e for e in store["expenses"] if not (e.get("id") == expense_id and e.get("user_id") == user_id)]
    if len(store["expenses"]) < initial_len:
        persist_store()
        return True
    return False
