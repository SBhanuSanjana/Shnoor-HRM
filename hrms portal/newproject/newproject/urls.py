from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('myapp.urls')), # This will now include all our new links automatically
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)