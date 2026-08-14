# Jambo PMS

## Overview

Jambo PMS is a React + Vite property-management application with a hospitality point-of-sale terminal, menu management, order history, front desk, rooms, billing, inventory, and reporting workflows.

## Run

- Install dependencies: `npm install`
- Start the development preview: `npm run dev -- --host 0.0.0.0 --port 5000`
- Create a production client build: `npx vite build`

The POS experience lives in `src/features/pos/` and is available at `/pos`, `/pos/orders`, and `/pos/menu`. The terminal is designed for desktop split view and switches to a mobile order drawer on narrow screens.

## User preferences

- Preserve the existing React + Vite structure and application workflows.
- Prefer focused UI improvements over broad architectural changes.