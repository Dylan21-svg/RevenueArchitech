from app.core.supabase import supabase

# Just to see if get_user accepts a jwt arg
import inspect
print(inspect.signature(supabase.auth.get_user))
