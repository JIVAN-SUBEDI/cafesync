# Hotel Management System

A comprehensive subscription-based hotel management system built with Node.js, Express, and PostgreSQL.

## Features

### Multi-tenancy Architecture
- Each hotel operates in isolation
- Main admin can monitor all hotels
- Hotel admin manages their own hotel

### Role-Based Access Control
- Main Admin (Developers)
- Hotel Admin (Subscription Owners)
- Staff Roles: Waiter, Cook, Receptionist, Kitchen Manager, Cashier, Cleaner

### Core Features
- **Hotel Management**: Subscription plans, billing, hotel profiles
- **Staff Management**: Create, update, and manage staff credentials
- **Table Management**: Configure and monitor table status
- **Menu Management**: Categories, items, pricing, variants
- **Order Management**: Complete order lifecycle from creation to payment
- **Kitchen Display System**: Real-time order tracking for kitchen staff
- **Real-time Updates**: WebSocket-based notifications
- **Reporting & Analytics**: Sales reports, revenue tracking, popular items
- **Notifications**: In-app notifications for all users
- **Activity Logs**: Comprehensive audit trail

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt
- **Real-time**: Socket.IO
- **Containerization**: Docker, Docker Compose
- **Monitoring**: PgAdmin

## Project Structure
