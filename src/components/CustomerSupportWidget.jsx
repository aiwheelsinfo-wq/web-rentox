import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = 'https://agnicarrental.com/admin2025/support_chat.php';

export default function CustomerSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('rentox_cust_phone') || '');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('rentox_cust_name') || '');
  const [isRegistered, setIsRegistered] = useState(() => !!localStorage.getItem('rentox_cust_phone'));

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Fetch messages from backend
  const fetchMessages = async (phoneToFetch = customerPhone) => {
    if (!phoneToFetch) return;
    try {
      const res = await axios.get(`${API_BASE}?action=get_messages&user_phone=${phoneToFetch}&user_type=customer&reader=customer`);
      if (res.data && res.data.status === 'success') {
        const list = res.data.messages || [];
        setMessages(list);

        // If widget is closed, count unread messages from admin
        if (!isOpen) {
          const unread = list.filter(m => m.sender_type === 'admin' && m.is_read === 0).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.error('Support fetch error:', err);
    }
  };

  // Live polling
  useEffect(() => {
    if (isRegistered && customerPhone) {
      fetchMessages(customerPhone);
      const timer = setInterval(() => {
        fetchMessages(customerPhone);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isRegistered, customerPhone, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Register Customer Profile
  const handleRegister = (e) => {
    e.preventDefault();
    const cleanPhone = customerPhone.trim();
    const cleanName = customerName.trim() || 'Passenger';
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    localStorage.setItem('rentox_cust_phone', cleanPhone);
    localStorage.setItem('rentox_cust_name', cleanName);
    setIsRegistered(true);
    fetchMessages(cleanPhone);
  };

  // Send Message
  const handleSendMessage = async (textToSend = null) => {
    const msg = (textToSend || inputText).trim();
    if (!msg || !customerPhone || isSending) return;

    setIsSending(true);
    if (!textToSend) setInputText('');

    try {
      const payload = {
        user_type: 'customer',
        user_phone: customerPhone,
        sender_type: 'customer',
        sender_name: customerName || 'Passenger',
        message: msg
      };

      const res = await axios.post(`${API_BASE}?action=send_message`, payload);
      if (res.data && res.data.status === 'success') {
        setMessages(prev => [...prev, res.data.data]);
      }
    } catch (err) {
      console.error('Failed to send customer message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const quickQuestions = [
    'Are tolls & driver allowances included?',
    'How do I track my assigned driver?',
    'What is your cancellation policy?'
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'relative',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#1E232F',
            border: '2px solid #F5A623',
            color: '#FFFFFF',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(245, 166, 35, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(245, 166, 35, 0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 166, 35, 0.35)';
          }}
          title="Chat with Customer Support"
        >
          <i className="fas fa-headset" style={{ fontSize: '24px', color: '#F5A623' }}></i>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '9999px',
              minWidth: '20px',
              height: '20px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Live Chat Window */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out'
        }}>
          {/* Header Bar */}
          <div style={{
            backgroundColor: '#1C1F26',
            padding: '16px 20px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #F5A623'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245,166,35,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #F5A623'
              }}>
                <i className="fas fa-headset" style={{ color: '#F5A623', fontSize: '16px' }}></i>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, letterSpacing: '-0.01em' }}>Rentox Support</h3>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>24/7 Travel & Booking Assistance</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px'
              }}
              title="Close chat"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Registration Form if not set */}
          {!isRegistered ? (
            <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  fontSize: '24px'
                }}>
                  <i className="fas fa-comments"></i>
                </div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Welcome to Live Support</h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                  Enter your mobile number to chat with our operations desk.
                </p>
              </div>

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Mobile Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#F5A623',
                    color: '#111827',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(245,166,35,0.4)'
                  }}
                >
                  Start Conversation
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Message History Feed */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ textAlign: 'center', margin: '4px 0 10px 0' }}>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#E5E7EB', color: '#4B5563', padding: '3px 10px', borderRadius: '9999px' }}>
                    Connected with Rentox Travel Desk
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: '#9CA3AF' }}>
                    <i className="fas fa-comment-dots" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.4 }}></i>
                    <p style={{ margin: 0, fontSize: '0.82rem' }}>How can we assist you today?</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_type === 'customer';
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '3px', padding: '0 4px' }}>
                          {isMe ? 'You' : 'Rentox Support'} • {msg.created_at ? msg.created_at.split(' ')[1]?.slice(0, 5) : ''}
                        </div>

                        <div style={{
                          maxWidth: '78%',
                          padding: '10px 14px',
                          borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          backgroundColor: isMe ? '#1C1F26' : '#FFFFFF',
                          color: isMe ? '#FFFFFF' : '#1F2937',
                          border: isMe ? 'none' : '1px solid #E5E7EB',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          fontSize: '0.82rem',
                          lineHeight: 1.45,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div style={{
                padding: '6px 12px',
                backgroundColor: '#F3F4F6',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                flexShrink: 0
              }}>
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isSending}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.7rem',
                      color: '#374151',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Text Input Footer */}
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0
              }}>
                <input
                  type="text"
                  placeholder="Type your question..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isSending || !inputText.trim()}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSending || !inputText.trim() ? '#E5E7EB' : '#F5A623',
                    color: isSending || !inputText.trim() ? '#9CA3AF' : '#111827',
                    cursor: isSending || !inputText.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
