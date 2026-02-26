# Database Schema Design (Production Ready)

## Profiles Table
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key (matches Supabase Auth ID) |
| `email` | VARCHAR | User email |
| `username` | VARCHAR | Unique Peach identifier |
| `alias` | VARCHAR | Display name (e.g., "Golden Professional") |
| `profession` | VARCHAR | User's profession (e.g., "Nursing", "Tech") |
| `level` | VARCHAR | Experience level (e.g., "Intern", "Senior Professional") |
| `job` | VARCHAR | Specific job title |
| `photo_url` | VARCHAR | Profile image URL |
| `is_premium` | BOOLEAN | Premium membership status |
| `daily_unripes` | INTEGER | Remaining free unripes/ripens for the day |
| `onboarding_complete` | BOOLEAN | Whether the user finished onboarding |
| `kyc_status` | VARCHAR | 'not_verified', 'pending', 'verified', 'rejected' |
| `is_business` | BOOLEAN | Whether user has a business account |
| `ads` | JSONB | Array of ads posted by the user |
| `basics` | JSONB | Interests and media preferences |
| `life` | JSONB | Based location and upbringing info |
| `relationships` | JSONB | Values and what they're looking for |
| `vision` | TEXT | Future vision |
| `special` | TEXT | What makes them special |
| `payment_history` | JSONB | History of Paystack transactions |
| `expires_at` | TIMESTAMP | Premium subscription expiry |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last profile update |

## Ripened Users Table
| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | Primary Key |
| `user_id` | UUID | User who did the ripening |
| `target_user_id` | UUID | User who was ripened |
| `created_at` | TIMESTAMP | When it happened |

## Matches Table
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `user_id_1` | UUID | Foreign Key to Profiles |
| `user_id_2` | UUID | Foreign Key to Profiles |
| `created_at` | TIMESTAMP | When the match occurred |

## Messages Table
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `match_id` | UUID | Foreign Key to Matches |
| `sender_id` | UUID | Foreign Key to Profiles |
| `content` | TEXT | Message text |
| `read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMP | Sent time |
