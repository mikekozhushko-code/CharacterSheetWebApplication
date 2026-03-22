from django.urls import path
from .views import CreateSessionView, JoinSessionView, SessionDetailView

urlpatterns = [
    path('table/create/',       CreateSessionView.as_view(),  name='table_create'),
    path('table/join/',         JoinSessionView.as_view(),    name='table_join'),
    path('table/<str:code>/',   SessionDetailView.as_view(),  name='table_detail'),
]