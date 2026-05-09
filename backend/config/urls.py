"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    #  JWT Auth endpoints
    path('api/token/',          TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('api/token/refresh/',  TokenRefreshView.as_view(),     name='token_refresh'),
    path('api/token/verify/',   TokenVerifyView.as_view(),      name='token_verify'),
path('api/books/',         include('books.urls')),
]