from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # ── JWT Authentication ────────────────────────────────
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ── Apps ───────────────────────────────────────────────
    path('api/books/', include('books.urls')),
    path('api/users/', include('users.urls')),  
    # path('api/users/', include('users.urls')),  # إذا عندك users app
    # path('api/returned/', include('returned_books.urls')),  # إذا عندك returned_books app
]

# ── Static & Media Files ───────────────────────────────────
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)