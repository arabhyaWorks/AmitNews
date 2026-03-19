#!/usr/bin/env python3
"""Seed script to create admin user and sample articles"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Create admin user
    admin_email = "admin@samachar.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if not existing_admin:
        admin_id = f"user_{uuid.uuid4().hex[:12]}"
        admin_doc = {
            "user_id": admin_id,
            "email": admin_email,
            "name": "Admin",
            "password": hash_password("admin123"),
            "role": "admin",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        print(f"✓ Admin user created: {admin_email} / admin123")
    else:
        admin_id = existing_admin["user_id"]
        print(f"✓ Admin user exists: {admin_email}")
    
    # Create sample reporter
    reporter_email = "reporter@samachar.com"
    existing_reporter = await db.users.find_one({"email": reporter_email})
    
    if not existing_reporter:
        reporter_id = f"user_{uuid.uuid4().hex[:12]}"
        reporter_doc = {
            "user_id": reporter_id,
            "email": reporter_email,
            "name": "Reporter Demo",
            "password": hash_password("reporter123"),
            "role": "reporter",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(reporter_doc)
        print(f"✓ Reporter user created: {reporter_email} / reporter123")
    else:
        reporter_id = existing_reporter["user_id"]
        print(f"✓ Reporter user exists: {reporter_email}")
    
    # Create sample articles
    sample_articles = [
        {
            "title": "India Wins Cricket World Cup Final",
            "title_hi": "भारत ने क्रिकेट विश्व कप फाइनल जीता",
            "content": "<p>In a thrilling final match, <strong>Team India</strong> secured victory in the Cricket World Cup. The team displayed exceptional performance throughout the tournament.</p><p>The captain led from the front, scoring a magnificent century that will be remembered for years to come. The bowling unit also delivered crucial breakthroughs at key moments.</p><blockquote>This is a historic moment for Indian cricket - Head Coach</blockquote>",
            "content_hi": "<p>एक रोमांचक फाइनल मैच में, <strong>टीम इंडिया</strong> ने क्रिकेट विश्व कप में जीत हासिल की। टीम ने पूरे टूर्नामेंट में असाधारण प्रदर्शन किया।</p><p>कप्तान ने आगे से नेतृत्व किया, एक शानदार शतक बनाया जो वर्षों तक याद किया जाएगा।</p>",
            "category": "sports",
            "image_url": "https://images.unsplash.com/photo-1730739463889-34c7279277a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxjcmlja2V0JTIwbWF0Y2glMjBpbmRpYSUyMHN0YWRpdW18ZW58MHx8fHwxNzczOTEzMTcyfDA&ixlib=rb-4.1.0&q=85",
            "is_featured": True
        },
        {
            "title": "Parliament Passes Historic Bill on Digital Privacy",
            "title_hi": "संसद ने डिजिटल गोपनीयता पर ऐतिहासिक विधेयक पारित किया",
            "content": "<p>The Parliament has passed a landmark bill on digital privacy that will change how personal data is handled in the country.</p><p>The new legislation includes:</p><ul><li>Stronger consent requirements for data collection</li><li>Heavy penalties for data breaches</li><li>Creation of a Data Protection Authority</li></ul>",
            "content_hi": "<p>संसद ने डिजिटल गोपनीयता पर एक ऐतिहासिक विधेयक पारित किया है जो देश में व्यक्तिगत डेटा को संभालने के तरीके को बदल देगा।</p>",
            "category": "politics",
            "image_url": "https://images.unsplash.com/photo-1760872645826-ff7a32cd59bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBwYXJsaWFtZW50JTIwYnVpbGRpbmd8ZW58MHx8fHwxNzczOTEzMTczfDA&ixlib=rb-4.1.0&q=85",
            "is_featured": True
        },
        {
            "title": "Bollywood Star Announces New Film Project",
            "title_hi": "बॉलीवुड स्टार ने नई फिल्म परियोजना की घोषणा की",
            "content": "<p>A leading Bollywood actor has announced their upcoming film project, which promises to be a visual spectacle.</p><p>The film will be shot across multiple international locations and features a stellar cast of both veteran and new actors.</p>",
            "content_hi": "<p>एक प्रमुख बॉलीवुड अभिनेता ने अपनी आगामी फिल्म परियोजना की घोषणा की है, जो एक दृश्य उत्सव होने का वादा करती है।</p>",
            "category": "entertainment",
            "image_url": "https://images.unsplash.com/photo-1614115866447-c9a299154650?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxib2xseXdvb2QlMjByZWQlMjBjYXJwZXQlMjBldmVudHxlbnwwfHx8fDE3NzM5MTMxODd8MA&ixlib=rb-4.1.0&q=85",
            "is_featured": True
        },
        {
            "title": "Stock Market Hits All-Time High",
            "title_hi": "शेयर बाजार ने अब तक का उच्चतम स्तर छुआ",
            "content": "<p>The stock market reached an all-time high today, driven by strong corporate earnings and positive economic indicators.</p><p>Key sectors that performed well include:</p><ul><li>Technology</li><li>Banking</li><li>Healthcare</li></ul>",
            "content_hi": "<p>शेयर बाजार आज अपने अब तक के उच्चतम स्तर पर पहुंच गया, मजबूत कॉर्पोरेट आय और सकारात्मक आर्थिक संकेतकों से प्रेरित।</p>",
            "category": "business",
            "image_url": "https://images.unsplash.com/photo-1761818645943-a3689c34ca03?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBvZmZpY2UlMjBidXNpbmVzcyUyMG1lZXRpbmclMjBpbmRpYXxlbnwwfHx8fDE3NzM5MTMxODh8MA&ixlib=rb-4.1.0&q=85",
            "is_featured": False
        },
        {
            "title": "New AI Technology Revolutionizes Healthcare",
            "title_hi": "नई AI तकनीक स्वास्थ्य सेवा में क्रांति ला रही है",
            "content": "<p>A groundbreaking AI technology is transforming how diseases are diagnosed and treated.</p><p>The new system can detect early signs of cancer with 95% accuracy, potentially saving millions of lives.</p>",
            "content_hi": "<p>एक अभूतपूर्व AI तकनीक बीमारियों के निदान और उपचार के तरीके को बदल रही है।</p>",
            "category": "technology",
            "image_url": "https://images.unsplash.com/photo-1680992044138-ce4864c2b962?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwzfHx0ZWNobm9sb2d5JTIwYWJzdHJhY3QlMjBzZXJ2ZXIlMjByb29tfGVufDB8fHx8MTc3MzkxMzE4OXww&ixlib=rb-4.1.0&q=85",
            "is_featured": False
        },
        {
            "title": "Police Crack Major Cyber Fraud Network",
            "title_hi": "पुलिस ने प्रमुख साइबर धोखाधड़ी नेटवर्क का पर्दाफाश किया",
            "content": "<p>In a major breakthrough, police have dismantled a cyber fraud network that had defrauded thousands of people across the country.</p><p>The gang operated through fake websites and phishing attacks, stealing personal and financial information.</p>",
            "content_hi": "<p>एक बड़ी सफलता में, पुलिस ने एक साइबर धोखाधड़ी नेटवर्क को ध्वस्त कर दिया है जिसने देश भर में हजारों लोगों को ठगा था।</p>",
            "category": "crime",
            "image_url": "https://images.unsplash.com/photo-1758354973067-9c8811edcfd7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4MTJ8MHwxfHNlYXJjaHwyfHxjcmltZSUyMHNjZW5lJTIwaW52ZXN0aWdhdGlvbiUyMHRhcGV8ZW58MHx8fHwxNzczOTEzMTkwfDA&ixlib=rb-4.1.0&q=85",
            "is_featured": False
        }
    ]
    
    # Check if articles already exist
    article_count = await db.articles.count_documents({})
    
    if article_count == 0:
        for article in sample_articles:
            article_id = f"article_{uuid.uuid4().hex[:12]}"
            now = datetime.now(timezone.utc).isoformat()
            
            article_doc = {
                "article_id": article_id,
                "title": article["title"],
                "title_hi": article["title_hi"],
                "content": article["content"],
                "content_hi": article["content_hi"],
                "category": article["category"],
                "image_url": article["image_url"],
                "is_featured": article["is_featured"],
                "status": "published",
                "author_id": reporter_id,
                "author_name": "Reporter Demo",
                "created_at": now,
                "updated_at": now,
                "views": 0
            }
            
            await db.articles.insert_one(article_doc)
        
        print(f"✓ Created {len(sample_articles)} sample articles")
    else:
        print(f"✓ Articles already exist: {article_count} articles")
    
    client.close()
    print("\n✓ Seed completed successfully!")
    print("\nLogin credentials:")
    print("  Admin: admin@samachar.com / admin123")
    print("  Reporter: reporter@samachar.com / reporter123")

if __name__ == "__main__":
    asyncio.run(seed())
