import sqlite3

# 1. Connect to a database (it creates the file if it doesn't exist)
conn = sqlite3.connect('github_installations.db')
c = conn.cursor()

# 2. Create a table (if not already created)
c.execute('''
    CREATE TABLE IF NOT EXISTS installations (
        id INTEGER PRIMARY KEY
    )
''')
conn.commit()

# 3. Function to save an installation ID
def save_installation_id(installation_id: int):
    c.execute('INSERT OR IGNORE INTO installations (id) VALUES (?)', (installation_id,))
    conn.commit()

# 4. Example: save some installation IDs
save_installation_id(12345)
save_installation_id(67890)

# 5. Fetch and print all installation IDs
c.execute('SELECT * FROM installations')
rows = c.fetchall()
print('Saved Installation IDs:')
for row in rows:
    print(row[0])

# 6. Close connection
conn.close()
