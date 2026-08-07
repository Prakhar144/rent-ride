document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject HTML
  const chatbotHTML = `
    <div class="rr-chatbot-btn" id="rrChatbotBtn">
      <span>💬</span>
    </div>
    <div class="rr-chatbot-window" id="rrChatbotWindow">
      <div class="rr-chatbot-header">
        <div class="rr-chatbot-title">🤖 Rent Ride Support</div>
        <button class="rr-chatbot-close" id="rrChatbotClose">×</button>
      </div>
      <div class="rr-chatbot-messages" id="rrChatbotMessages">
        <div class="rr-msg bot">Hi there! I'm the Rent Ride assistant. How can I help you today?</div>
      </div>
      <div class="rr-chatbot-input-area">
        <input type="text" id="rrChatbotInput" placeholder="Type your question..." autocomplete="off" />
        <button id="rrChatbotSend">Send</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);

  // 2. Element references
  const btn = document.getElementById('rrChatbotBtn');
  const win = document.getElementById('rrChatbotWindow');
  const close = document.getElementById('rrChatbotClose');
  const messages = document.getElementById('rrChatbotMessages');
  const input = document.getElementById('rrChatbotInput');
  const send = document.getElementById('rrChatbotSend');

  // 3. Toggle Logic
  btn.addEventListener('click', () => win.classList.add('active'));
  close.addEventListener('click', () => win.classList.remove('active'));

  // 4. Chat Logic
  const responses = {
    book: "To book a vehicle, go to our Vehicles or City Rides page, select the vehicle you want, and click 'Book'. You'll need to sign in first!",
    rent: "To rent a vehicle, go to our Vehicles or City Rides page, select the vehicle you want, and click 'Book'. You'll need to sign in first!",
    price: "Our prices start from ₹30/day for bikes, ₹25/day for scooters, and ₹50/day for cars. Check the exact price on the vehicle's listing.",
    cost: "Our prices start from ₹30/day for bikes, ₹25/day for scooters, and ₹50/day for cars. Check the exact price on the vehicle's listing.",
    contact: "You can reach out to us via our Contact page or call our support line at 1800-RENT-RIDE.",
    support: "You can reach out to us via our Contact page or call our support line at 1800-RENT-RIDE.",
    cancel: "You can cancel your booking from your Profile page under 'My Bookings'. Cancellation policies may apply.",
    hello: "Hello! How can I assist you with your rental today?",
    hi: "Hi! How can I assist you with your rental today?",
    hey: "Hey there! Need help finding a ride?"
  };

  function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `rr-msg ${sender}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    
    appendMessage(text, 'user');
    input.value = '';

    // Generate response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let found = false;
      for (const [key, answer] of Object.entries(responses)) {
        if (lower.includes(key)) {
          appendMessage(answer, 'bot');
          found = true;
          break;
        }
      }
      if (!found) {
        appendMessage("I'm still learning and don't understand everything! Please visit our Contact page or email support@rentride.com for further help.", 'bot');
      }
    }, 600);
  }

  send.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});
