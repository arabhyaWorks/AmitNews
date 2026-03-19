import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FileText, Eye, Edit, Trash2, Plus, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { t, isHindi } = useLanguage();
  const navigate = useNavigate();
  
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, views: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchArticles();
  }, [filter]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = { author_id: user?.user_id };
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await axios.get(`${API}/articles`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      setArticles(response.data);
      
      // Calculate stats
      const allArticles = await axios.get(`${API}/articles`, {
        params: { author_id: user?.user_id },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      const total = allArticles.data.length;
      const published = allArticles.data.filter(a => a.status === 'published').length;
      const drafts = allArticles.data.filter(a => a.status === 'draft').length;
      const views = allArticles.data.reduce((sum, a) => sum + (a.views || 0), 0);
      
      setStats({ total, published, drafts, views });
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error(isHindi ? 'लेख लोड करने में त्रुटि' : 'Error loading articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await axios.delete(`${API}/articles/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success(t('articleDeleted'));
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(isHindi ? 'हटाने में त्रुटि' : 'Error deleting article');
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="status-published">{isHindi ? 'प्रकाशित' : 'Published'}</span>;
      case 'draft':
        return <span className="status-draft">{isHindi ? 'ड्राफ्ट' : 'Draft'}</span>;
      case 'revoked':
        return <span className="status-revoked">{isHindi ? 'रद्द' : 'Revoked'}</span>;
      default:
        return <span className="status-draft">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold text-[#2a5a5a] ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
              {t('dashboard')}
            </h1>
            <p className={`text-gray-600 mt-1 ${isHindi ? 'font-hindi' : ''}`}>
              {isHindi ? `स्वागत है, ${user?.name}` : `Welcome, ${user?.name}`}
            </p>
          </div>
          <Link to="/editor">
            <Button className="mt-4 md:mt-0 bg-[#f4c430] text-[#2a5a5a] hover:bg-[#e0b020] font-bold" data-testid="new-article-btn">
              <Plus className="w-4 h-4 mr-2" />
              {t('writeArticle')}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card" data-testid="stat-total">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#2a5a5a]/10 rounded flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#2a5a5a]" />
              </div>
              <div>
                <p className={`text-sm text-gray-500 ${isHindi ? 'font-hindi' : ''}`}>{t('totalArticles')}</p>
                <p className="text-2xl font-bold text-[#2a5a5a]">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card" data-testid="stat-published">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className={`text-sm text-gray-500 ${isHindi ? 'font-hindi' : ''}`}>{t('published')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card" data-testid="stat-drafts">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded flex items-center justify-center">
                <Edit className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className={`text-sm text-gray-500 ${isHindi ? 'font-hindi' : ''}`}>{t('drafts')}</p>
                <p className="text-2xl font-bold text-amber-600">{stats.drafts}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card" data-testid="stat-views">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#f4c430]/20 rounded flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#f4c430]" />
              </div>
              <div>
                <p className={`text-sm text-gray-500 ${isHindi ? 'font-hindi' : ''}`}>{t('totalViews')}</p>
                <p className="text-2xl font-bold text-[#f4c430]">{stats.views}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['all', 'published', 'draft'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
                filter === f 
                  ? 'text-[#2a5a5a] border-b-2 border-[#2a5a5a]' 
                  : 'text-gray-500 hover:text-[#2a5a5a]'
              }`}
              data-testid={`filter-${f}`}
            >
              {f === 'all' ? (isHindi ? 'सभी' : 'All') : t(f === 'published' ? 'published' : 'drafts')}
            </button>
          ))}
        </div>

        {/* Articles Table */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className={`text-gray-500 ${isHindi ? 'font-hindi' : ''}`}>
                {isHindi ? 'कोई लेख नहीं मिला' : 'No articles found'}
              </p>
              <Link to="/editor">
                <Button className="mt-4 bg-[#2a5a5a] hover:bg-[#1f4444] text-white">
                  {t('writeArticle')}
                </Button>
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('title')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('category')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('status')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('views')}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{isHindi ? 'तारीख' : 'Date'}</th>
                  <th className={isHindi ? 'font-hindi' : ''}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.article_id} data-testid={`article-row-${article.article_id}`}>
                    <td>
                      <div className="max-w-xs">
                        <p className={`font-semibold text-gray-900 line-clamp-1 ${isHindi ? 'font-hindi' : ''}`}>
                          {isHindi && article.title_hi ? article.title_hi : article.title}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className={`category-pill ${isHindi ? 'font-hindi' : ''}`}>
                        {t(article.category.toLowerCase())}
                      </span>
                    </td>
                    <td>{getStatusBadge(article.status)}</td>
                    <td>{article.views || 0}</td>
                    <td className="text-sm text-gray-500">{formatDate(article.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/article/${article.article_id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2a5a5a]">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link to={`/editor/${article.article_id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2a5a5a]">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-500 hover:text-red-600"
                          onClick={() => setDeleteId(article.article_id)}
                          data-testid={`delete-btn-${article.article_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={isHindi ? 'font-hindi-heading' : 'font-heading'}>
              {isHindi ? 'लेख हटाएं?' : 'Delete Article?'}
            </AlertDialogTitle>
            <AlertDialogDescription className={isHindi ? 'font-hindi' : ''}>
              {isHindi 
                ? 'यह क्रिया पूर्ववत नहीं की जा सकती। लेख स्थायी रूप से हटा दिया जाएगा।'
                : 'This action cannot be undone. The article will be permanently deleted.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isHindi ? 'font-hindi' : ''}>
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              {isHindi ? 'हटाएं' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
