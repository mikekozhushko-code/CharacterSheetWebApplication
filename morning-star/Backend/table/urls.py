from django.urls import path
from .views import (
    CreateSessionView, JoinSessionView,
    SessionDetailView, SceneListCreateView, SceneDetailView
)

urlpatterns = [
    path('table/create/',                       CreateSessionView.as_view(),   name='table_create'),
    path('table/join/',                         JoinSessionView.as_view(),     name='table_join'),
    path('table/<str:code>/',                   SessionDetailView.as_view(),   name='table_detail'),
    path('table/<str:code>/scenes/',            SceneListCreateView.as_view(), name='scene_list_create'),
    path('table/<str:code>/scenes/<int:scene_id>/', SceneDetailView.as_view(), name='scene_detail'),
]