from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.generic import TemplateView
urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # ── JWT Authentication ────────────────────────────────
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ── Apps ───────────────────────────────────────────────
    path('api/books/', include('books.urls')),
    path('api/users/', include('users.urls')),  
    
    # Frontend pages
    path('',                TemplateView.as_view(template_name='index.html'),           name='index'),
    path('login/',          TemplateView.as_view(template_name='login.html'),           name='login'),
    path('register/',       TemplateView.as_view(template_name='Register.html'),        name='register'),
    path('homepage/',       TemplateView.as_view(template_name='homepage.html'),        name='homepage'),
    path('dashboard/',      TemplateView.as_view(template_name='dashboard.html'),       name='dashboard'),
    path('add-book/',       TemplateView.as_view(template_name='add-book.html'),        name='add-book'),
    path('book-details/',   TemplateView.as_view(template_name='book-details.html'),    name='book-details'),
    path('manage-books/',   TemplateView.as_view(template_name='manage-books.html'),    name='manage-books'),
    path('search-books/',   TemplateView.as_view(template_name='search-books.html'),    name='search-books'),
    path('view-books/',     TemplateView.as_view(template_name='view-books.html'),      name='view-books'),
    path('borrowed-books/', TemplateView.as_view(template_name='borrowed-books.html'),  name='borrowed-books'),
    path('returned-books/', TemplateView.as_view(template_name='returned-books.html'),  name='returned-books'),
    path('user-dashboard/', TemplateView.as_view(template_name='user-dashboard.html'),  name='user-dashboard'),
    path('forgetpass1/',    TemplateView.as_view(template_name='forgetpass1.html'),     name='forgetpass1'),
    path('forgetpass2/',    TemplateView.as_view(template_name='forgetpass2.html'),    name='forgetpass2'),
]

# ── Static & Media Files ───────────────────────────────────
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)