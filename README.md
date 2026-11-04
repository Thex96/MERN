# FoodEase

FoodEase is a restaurant discovery and food ordering application. Customers browse approved restaurants, save delivery addresses, build a cart and place cash-on-delivery orders. Restaurant managers submit applications, track review decisions, update approved menus and process orders. Administrators review restaurant applications.

The client uses React, Vite and React Router. The API uses Node.js, Express and MongoDB with Mongoose. Email verification and review notices use SMTP. Address geocoding and distance-based delivery fees are handled by the server.

## Requirements

- Node.js 20.19 or newer
- MongoDB, local or hosted
- SMTP account for email verification and review notifications
- Internet access for the configured address geocoder

## Configure the server

1. Create a MongoDB database.
2. Set 'MONGO_URI' to your database connection string.
3. Replace the sample 'JWT_SECRET' with a unique random secret of at least 32 characters. The sample value is intentionally rejected by the server.
4. Set 'CLIENT_URL' to the browser origin used by the client. Set 'PUBLIC_API_URL' to the public server origin when deploying.
5. Enter your SMTP host, port, username, password, sender address and 'ADMIN_NOTIFICATION_EMAIL' to enable email delivery.
6. Set 'GEOCODER_USER_AGENT' to include a real contact email. The default geocoder uses OpenStreetMap Nominatim and requires internet access. Set 'GEOCODER_URL' when using another compatible service.
7. Adjust the delivery fee and maximum distance values for your service area.

## Configure the client

Set 'VITE_API_URL' to the API base URL and adjust the app name, currency and locale if needed.

## Install and run

In one terminal:

cd server
npm install
npm start

In another terminal:

cd client
npm install
npm run dev

## Create the first administrator

Temporarily set 'ADMIN_USERNAME', 'ADMIN_EMAIL' and 'ADMIN_PASSWORD' in 'server/.env', then run this from the 'server' directory:

npm run create-admin

Remove 'ADMIN_PASSWORD' from the environment file after the account is created.

## Existing database migration

New installations do not need a migration. If your database contains records from an older FoodEase version, review and back up the database, then run the migration once from the 'server' directory:


npm run migrate-legacy-restaurants

It converts legacy draft applications to rejected applications, updates their legacy submission-history values and removes the obsolete 'deliveryTime' and 'priceRange' fields. The migration is no longer run automatically when the server starts. The command only updates records that still contain legacy values and can be rerun safely.

## Main features

- Email-code account verification and customer or restaurant-manager sign-in
- Restaurant applications with pending, approved and rejected statuses
- Administrator review with a required reason for rejection
- Manager resubmission after rejection and menu or operating-hour updates after approval
- Public browsing of approved restaurants and menus
- Saved customer delivery addresses with server-side geocoding
- Delivery distance and fee calculation, server-validated menu prices and order totals
- Customer order history and restaurant order-status management
- Cash on delivery

The database supplies registered restaurant listings and menus. Restaurant image and document uploads are stored under 'server/uploads'. Public restaurant images are served through the API's '/uploads/images' path.

## Limitations

The project does not define an automated test script. Full account, restaurant-review, geocoding and ordering checks require configured MongoDB, SMTP and geocoder services. Online payment processing is outside the current implementation.