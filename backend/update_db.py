import sqlite3

conn = sqlite3.connect("resumeai.db")
cursor = conn.cursor()

cursor.execute("ALTER TABLE jobs ADD COLUMN embedding TEXT")

conn.commit()
conn.close()

print("Column added successfully")