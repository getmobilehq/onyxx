#!/usr/bin/env python3
import psycopg2
from psycopg2 import sql

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'database': 'onyx',
    'user': 'jojo',
    'password': 'Montg0m3r!',
    'port': 5432
}

def cleanup_assessments():
    try:
        # Connect to the database
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("=== Database Cleanup Script ===\n")
        
        # 1. Check current data counts
        print("1. Current data counts:")
        cur.execute("""
            SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
            UNION ALL
            SELECT COUNT(*), 'assessment_elements' FROM assessment_elements
            UNION ALL
            SELECT COUNT(*), 'buildings' FROM buildings
            UNION ALL
            SELECT COUNT(*), 'users' FROM users
            ORDER BY table_name;
        """)
        for row in cur.fetchall():
            print(f"   {row[1]}: {row[0]} records")
        
        # 2. Show sample assessments before deletion
        print("\n2. Sample assessments before deletion:")
        cur.execute("SELECT id, building_id, user_id, type, status, created_at FROM assessments LIMIT 5;")
        assessments = cur.fetchall()
        if assessments:
            for assessment in assessments:
                print(f"   ID: {assessment[0]}, Building: {assessment[1]}, User: {assessment[2]}, Type: {assessment[3]}, Status: {assessment[4]}")
        else:
            print("   No assessments found.")
        
        # 3. Show sample assessment elements before deletion
        print("\n3. Sample assessment elements before deletion:")
        cur.execute("SELECT id, assessment_id, element_type, is_accessible FROM assessment_elements LIMIT 5;")
        elements = cur.fetchall()
        if elements:
            for element in elements:
                print(f"   ID: {element[0]}, Assessment: {element[1]}, Type: {element[2]}, Accessible: {element[3]}")
        else:
            print("   No assessment elements found.")
        
        # 4. Delete all assessment elements (due to foreign key constraints)
        print("\n4. Deleting all assessment_elements...")
        cur.execute("DELETE FROM assessment_elements;")
        deleted_elements = cur.rowcount
        print(f"   Deleted {deleted_elements} assessment elements.")
        
        # 5. Delete all assessments
        print("\n5. Deleting all assessments...")
        cur.execute("DELETE FROM assessments;")
        deleted_assessments = cur.rowcount
        print(f"   Deleted {deleted_assessments} assessments.")
        
        # Commit the deletions
        conn.commit()
        
        # 6. Verify deletion
        print("\n6. Verification after deletion:")
        cur.execute("""
            SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
            UNION ALL
            SELECT COUNT(*), 'assessment_elements' FROM assessment_elements;
        """)
        for row in cur.fetchall():
            print(f"   {row[1]}: {row[0]} records")
        
        # 7. Show available buildings
        print("\n7. Available buildings for new assessments:")
        cur.execute("SELECT id, name, type, address, city, state FROM buildings ORDER BY id;")
        buildings = cur.fetchall()
        if buildings:
            for building in buildings:
                print(f"   ID: {building[0]}, Name: {building[1]}, Type: {building[2]}")
                print(f"      Address: {building[3]}, {building[4]}, {building[5]}")
        else:
            print("   No buildings found.")
        
        # 8. Show available users
        print("\n8. Available users:")
        cur.execute("SELECT id, email, role FROM users ORDER BY id;")
        users = cur.fetchall()
        if users:
            for user in users:
                print(f"   ID: {user[0]}, Email: {user[1]}, Role: {user[2]}")
        else:
            print("   No users found.")
        
        print("\n=== Cleanup completed successfully! ===")
        
        # Close connections
        cur.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    cleanup_assessments()