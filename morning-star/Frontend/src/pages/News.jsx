import React from 'react';
import '../styles/News.css'; // Окремий файл стилів для новин
import Header from '../components/Header';
import Footer from '../components/Footer';

const News = () => {
    // Мокові дані для новин
    const newsData = [
        {
            id: 1,
            title: "Update v1.2: The Necromancer's Rise",
            date: "Jan 02, 2026",
            category: "Patch Note",
            image: "/assets/images/news_necromancer.jpg", // Заміни на свої зображення
            excerpt: "New spells, dark rituals, and a complete overhaul of the summoning mechanics. The dead do not rest easily..."
        },
        {
            id: 2,
            title: "Community Event: The Golden Goblet",
            date: "Dec 28, 2025",
            category: "Event",
            image: "/assets/images/news_tavern.jpg",
            excerpt: "Join us in the Tavern Near The River for a night of dice, drinks, and dangerous wagers. Exclusive rewards for winners!"
        },
        {
            id: 3,
            title: "Lore Deep Dive: History of Tieflings",
            date: "Dec 15, 2025",
            category: "Lore",
            image: "/assets/images/news_lore.jpg",
            excerpt: "Uncover the tragic and mysterious origins of the Tiefling bloodlines. Are they cursed or blessed?"
        },
        {
            id: 4,
            title: "System Maintenance",
            date: "Dec 10, 2025",
            category: "System",
            image: "/assets/images/news_system.jpg",
            excerpt: "Servers will be down for a short ritual to appease the machine spirits. Expected downtime: 2 hours."
        }
    ];

    const featuredNews = newsData[0]; // Перша новина - головна
    const otherNews = newsData.slice(1); // Решта

    return (
        <div className="news-page-wrapper">
            <Header />
            
            <div className="news-container">
                <div className="news-header-section">
                    <h1 className="page-title">Chronicles of the Realm</h1>
                    <p className="page-subtitle">Stay updated with the latest changes in the world.</p>
                </div>

                {/* FEATURED NEWS (Велика картка) */}
                <div className="featured-news-card">
                    <div className="featured-image-box">
                        {/* Тимчасова заглушка кольором, якщо немає картинки */}
                        <div className="img-placeholder" style={{backgroundImage: `url(${featuredNews.image})`}}></div> 
                    </div>
                    <div className="featured-content">
                        <div className="news-meta">
                            <span className={`news-tag tag-${featuredNews.category.toLowerCase().split(' ')[0]}`}>{featuredNews.category}</span>
                            <span className="news-date">{featuredNews.date}</span>
                        </div>
                        <h2 className="featured-title">{featuredNews.title}</h2>
                        <p className="featured-excerpt">{featuredNews.excerpt}</p>
                        <button className="read-more-btn">Read Full Story</button>
                    </div>
                </div>

                {/* NEWS GRID (Сітка інших новин) */}
                <div className="news-grid">
                    {otherNews.map(item => (
                        <div key={item.id} className="news-card">
                            <div className="card-image-box">
                                <div className="img-placeholder" style={{backgroundImage: `url(${item.image})`}}></div>
                            </div>
                            <div className="card-content">
                                <div className="news-meta">
                                    <span className={`news-tag tag-${item.category.toLowerCase().split(' ')[0]}`}>{item.category}</span>
                                    <span className="news-date">{item.date}</span>
                                </div>
                                <h3 className="card-title">{item.title}</h3>
                                <p className="card-excerpt">{item.excerpt}</p>
                                <a href="#" className="card-link">Read More →</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default News;