import React, { useState } from 'react';
import './SupportAssistant.css';

const SupportAssistant = ({ currentStep, onContactSupport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your KYC assistant. I can help you with any questions during the process.",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Step-specific guidance
  const getStepGuidance = (step) => {
    const guidance = {
      0: {
        title: "Welcome",
        tips: [
          "Welcome to HDFC Digital KYC! I'll guide you through each step.",
          "Make sure you have your documents ready (PAN card, Aadhaar card).",
          "The process usually takes 5-10 minutes to complete."
        ]
      },
      1: {
        title: "Personal Information",
        tips: [
          "Enter your name exactly as it appears on your documents.",
          "Use DD/MM/YYYY format for your date of birth.",
          "Provide your complete residential address.",
          "Make sure your phone number is active for OTP verification."
        ]
      },
      2: {
        title: "PAN Card Upload",
        tips: [
          "Place your PAN card on a flat, well-lit surface.",
          "Ensure all corners are visible and not cut off.",
          "Avoid glare or shadows on the document.",
          "Image should be in focus - no bluriness."
        ]
      },
      3: {
        title: "Aadhaar Verification",
        tips: [
          "Enter your 12-digit Aadhaar number carefully.",
          "You'll receive an OTP on your registered mobile number.",
          "If you don't receive the OTP within 2 minutes, use 'Resend OTP'.",
          "OTP is valid for 10 minutes."
        ]
      },
      4: {
        title: "Facial Recognition",
        tips: [
          "Position yourself in a well-lit area.",
          "Look directly at the camera.",
          "Remove glasses or headwear if possible.",
          "Follow the on-screen prompts for head movements.",
          "Stay still during the capture process."
        ]
      },
      5: {
        title: "Final Review",
        tips: [
          "Carefully review all information before submission.",
          "You can edit any information by clicking 'Edit' next to each section.",
          "Make sure all documents are clear and readable.",
          "Accept the terms and conditions to proceed."
        ]
      },
      6: {
        title: "Completion",
        tips: [
          "Your KYC is submitted successfully!",
          "You'll receive a confirmation email shortly.",
          "Final approval may take 24-48 hours.",
          "Keep your reference number for future reference."
        ]
      }
    };
    
    return guidance[step] || guidance[0];
  };

  const stepGuidance = getStepGuidance(currentStep);

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const responses = [
        "I understand your concern. Let me help you with that.",
        "That's a good question. Based on your current step, I recommend...",
        "I can see the issue. Try following these steps:",
        "Thanks for reaching out. Here's what you can do:",
        "I'm here to help! Based on your situation, I suggest:"
      ];
      
      const aiResponse = {
        id: messages.length + 2,
        text: `${responses[Math.floor(Math.random() * responses.length)]} ${getAutomatedHelp()}`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
    
    setInputMessage('');
  };

  const getAutomatedHelp = () => {
    const helpTips = {
      0: "For the welcome step, just click 'Get Started' to begin your KYC process.",
      1: "For personal information, make sure all fields are filled correctly. If you're having trouble with a specific field, double-check the format requirements.",
      2: "For document upload issues, ensure your image is clear and under 10MB. Try using a well-lit environment when taking photos.",
      3: "If OTP isn't arriving, check your mobile network. You can resend the OTP after 30 seconds.",
      4: "For facial recognition issues, ensure good lighting and follow the prompts carefully. Make sure your face is centered in the frame.",
      5: "In the review step, you can click 'Edit' next to any section to make corrections before final submission.",
      6: "After completion, you'll receive a reference number. Keep this for your records."
    };
    
    return helpTips[currentStep] || "I'm here to help with any questions you have about the KYC process. What specific issue are you facing?";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="support-assistant">
      <div className={`assistant-container ${isOpen ? 'open' : ''}`}>
        <div className="assistant-header" onClick={() => setIsOpen(!isOpen)}>
          <div className="assistant-icon">🤖</div>
          <div className="assistant-title">
            <h3>KYC Assistant</h3>
            <p>{isOpen ? 'Click to minimize' : 'Click to open assistant'}</p>
          </div>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Online</span>
          </div>
        </div>
        
        {isOpen && (
          <div className="assistant-content">
            <div className="step-guidance">
              <h4>Current Step: {stepGuidance.title}</h4>
              <ul>
                {stepGuidance.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
            
            <div className="chat-container">
              <div className="chat-messages">
                {messages.map(message => (
                  <div key={message.id} className={`message ${message.sender}`}>
                    <div className="message-content">
                      {message.text}
                    </div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for help with your KYC process..."
                />
                <button onClick={handleSendMessage}>Send</button>
              </div>
            </div>
            
            <div className="support-options">
              <button className="contact-support-btn" onClick={onContactSupport}>
                📞 Contact 24/7 Support
              </button>
              <button className="faq-btn">
                ❓ FAQ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportAssistant;