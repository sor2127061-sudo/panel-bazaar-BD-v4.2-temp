# panel bazaar BD v4.2

Dynamic categories support:
- `types.ts`: Added `Category` interface; `Product.category` changed to `string`, added `category_id`
- `Home.tsx`: Category pills fetched dynamically from Supabase `categories` table  
- `AdminDashboard.tsx`: New **Categories** tab (add/toggle/delete); Product modal uses dynamic categories

**Repository:** [panel-bazaar-BD-v4.2](https://github.com/sor2127061-sudo/panel-bazaar-BD-v4.2)
