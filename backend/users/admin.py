from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
 
 
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["id", "username", "email", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active"]
    search_fields = ["username", "email"]
    ordering = ["-created_at"]
 
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("created_at",)}),
    )
    readonly_fields = ["created_at"]
 
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2", "role"),
            },
        ),
    )
 