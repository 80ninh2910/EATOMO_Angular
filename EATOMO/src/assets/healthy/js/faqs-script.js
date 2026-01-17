document.addEventListener('DOMContentLoaded', function() {
    // Handle FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // Handle tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Here you would typically show/hide content based on the selected tab
            // For this demo, we're just changing the title
            const tabType = button.getAttribute('data-tab');
            const contentTitle = document.querySelector('.faq-content h2');
            
            switch(tabType) {
                case 'menu':
                    contentTitle.textContent = 'About Soumaki\'s Menu';
                    break;
                case 'food':
                    contentTitle.textContent = 'About Soumaki\'s Food';
                    break;
                case 'delivery':
                    contentTitle.textContent = 'About Delivery';
                    break;
                case 'payment':
                    contentTitle.textContent = 'About Payment';
                    break;
                default:
                    contentTitle.textContent = 'About Soumaki\'s Menu';
            }
        });
    });
    
    // Add animation for FAQ items on page load
    setTimeout(() => {
        faqItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 300);
});

const tabs = document.querySelectorAll('.tab-button');
const liquid = document.querySelector('.liquid-bg');

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab-button.active').classList.remove('active');
    tab.classList.add('active');

    const tabRect = tab.getBoundingClientRect();
    const parentRect = tab.parentElement.getBoundingClientRect();

    // Tính vị trí tương đối của "liquid glass"
    const offset = tabRect.left - parentRect.left + 5;
    const width = tabRect.width - 10;

    // Hiệu ứng chuyển động mềm mại
    liquid.style.width = `${width}px`;
    liquid.style.transform = `translateX(${offset}px)`;

    // Hiệu ứng "nảy" sáng nhẹ như chất lỏng
    liquid.animate(
      [
        { transform: `translateX(${offset}px) scale(1.05, 0.95)` },
        { transform: `translateX(${offset}px) scale(1, 1)` }
      ],
      {
        duration: 700,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    );
  });
});
