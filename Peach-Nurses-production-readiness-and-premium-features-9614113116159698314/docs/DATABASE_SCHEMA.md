# Database Schema Design

## Users Table
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `email` | VARCHAR | Unique, strictly email auth |
| `is_verified` | BOOLEAN | Email verification status |
| `alias` | VARCHAR | e.g., "Nurse_Peachy99" |
| `level` | ENUM | 'Year 1', 'Year 2', 'Year 3', 'Intern' |
| `pits_balance` | INTEGER | Current balance of Pits (Starts at 25) |
| `created_at` | TIMESTAMP | Account creation time |

## Profiles Table
| Column | Type | Description |
|---|---|---|
| `user_id` | UUID | Foreign Key to Users |
| `real_name` | VARCHAR | Hidden until ripped |
| `photo_url` | VARCHAR | Blurred until ripped |
| `location_lat` | FLOAT | Geolocation latitude |
| `location_long` | FLOAT | Geolocation longitude |
| `city` | VARCHAR | e.g., Sapele, Warri, Asaba, Ughelli |
| `school_hospital` | VARCHAR | Associated institution |

## Preferences Table (Likes/Dislikes)
| Column | Type | Description |
|---|---|---|
| `user_id` | UUID | Foreign Key to Users |
| `sweet_peaches` | JSONB | Array of selected Likes (e.g., ["Night shifts", "Skincare"]) |
| `bruised_peaches` | JSONB | Array of selected Dislikes (e.g., ["8 AM lectures"]) |

## Matches Table
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `user_a_id` | UUID | User A |
| `user_b_id` | UUID | User B |
| `compatibility_score` | INTEGER | 0-100 score |
| `is_ripped_by_a` | BOOLEAN | Has A paid to see B? |
| `is_ripped_by_b` | BOOLEAN | Has B paid to see A? |
| `status` | ENUM | 'pending', 'accepted', 'rejected' |
