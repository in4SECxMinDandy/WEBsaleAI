// ============================================================
// MongoDB Init Script — ML-Ecommerce Event Store
// ============================================================

db = db.getSiblingDB('ecommerce_events');

// Create collections with schema validation
db.createCollection('user_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['event_type', 'created_at'],
      properties: {
        user_id: { bsonType: 'string' },
        session_id: { bsonType: 'string' },
        product_id: { bsonType: 'string' },
        category_id: { bsonType: 'string' },
        event_type: {
          bsonType: 'string',
          enum: [
            'page_view', 'product_view', 'search',
            'add_to_cart', 'remove_from_cart', 'wishlist',
            'purchase', 'review', 'click_recommendation'
          ]
        },
        event_data: { bsonType: 'object' },
        ip_address: { bsonType: 'string' },
        user_agent: { bsonType: 'string' },
        referrer: { bsonType: 'string' },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for efficient querying
db.user_events.createIndex({ user_id: 1, created_at: -1 });
db.user_events.createIndex({ product_id: 1, event_type: 1 });
db.user_events.createIndex({ event_type: 1, created_at: -1 });
db.user_events.createIndex({ session_id: 1 });
db.user_events.createIndex({ created_at: -1 }, { expireAfterSeconds: 15552000 }); // 180 days TTL

// Create recommendation_logs collection
db.createCollection('recommendation_logs');
db.recommendation_logs.createIndex({ user_id: 1, created_at: -1 });
db.recommendation_logs.createIndex({ strategy: 1, created_at: -1 });

print('✅ MongoDB ecommerce_events database initialized');
