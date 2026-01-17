document.getElementById("backToTop").addEventListener("click", function() {
  window.scrollTo({
    top: 0,
    behavior: "smooth" // cuộn mượt
  });
});

// Mobile Menu Toggle
const mobileToggle = document.getElementById("mobileToggle")
const navMenu = document.getElementById("navMenu")

mobileToggle.addEventListener("click", () => {
  navMenu.classList.toggle("active")
  mobileToggle.classList.toggle("active")
})

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll(".nav-menu a")
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active")
    mobileToggle.classList.remove("active")
  })
})

// Header Scroll Effect
const header = document.getElementById("header")
let lastScroll = 0

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset

  if (currentScroll > 100) {
    header.classList.add("scrolled")
  } else {
    header.classList.remove("scrolled")
  }

  lastScroll = currentScroll
})

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Enhanced Animation on Scroll (AOS)
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add("aos-animate")
      }, index * 100)
    }
  })
}, observerOptions)

// Observe all elements with data-aos attribute
document.querySelectorAll("[data-aos]").forEach((element) => {
  observer.observe(element)
})

// Counter Animation for Stats
const animateCounter = (element, target, duration = 2000) => {
  let current = 0
  const increment = target / (duration / 16)
  const isPercentage = target === 100 || target === 90

  const updateCounter = () => {
    current += increment
    if (current < target) {
      element.textContent = Math.floor(current) + (isPercentage ? "%" : "+")
      requestAnimationFrame(updateCounter)
    } else {
      element.textContent = target + (isPercentage ? "%" : "+")
    }
  }

  updateCounter()
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const statNumbers = entry.target.querySelectorAll(".stat-number")
        statNumbers.forEach((stat) => {
          const text = stat.textContent
          const isPercentage = text.includes("%")
          const target = Number.parseInt(text)
          animateCounter(stat, target)
        })
        statsObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.5 },
)

const statsSection = document.querySelector(".story-stats")
if (statsSection) {
  statsObserver.observe(statsSection)
}

// Parallax Effect for Hero Section
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset
  const heroAbout = document.querySelector(".hero-about")

  if (heroAbout) {
    heroAbout.style.transform = `translateY(${scrolled * 0.5}px)`
  }
})

// Image Lazy Loading Enhancement
const images = document.querySelectorAll('img[src*="placeholder"]')
images.forEach((img) => {
  img.style.opacity = "0"
  img.style.transition = "opacity 0.5s ease-in"

  img.addEventListener("load", () => {
    img.style.opacity = "1"
  })
})

// Enhanced hover effect to cards
const cards = document.querySelectorAll(".value-card, .team-member, .feature-item")
cards.forEach((card) => {
  card.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-15px) scale(1.02)"
    this.style.boxShadow = "0 20px 50px rgba(76, 175, 80, 0.25)"
  })

  card.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0) scale(1)"
    this.style.boxShadow = ""
  })
})

// Enhanced CTA Buttons Click Handlers
const ctaButtons = document.querySelectorAll(".cta-buttons button, .btn-order")
ctaButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    // Add click animation
    button.style.transform = "scale(0.95)"
    setTimeout(() => {
      button.style.transform = ""
    }, 150)

    console.log("[v0] Button clicked:", button.textContent)
    // Add your order/menu navigation logic here
    alert("Chức năng đang được phát triển!")
  })
})

// Add ripple effect to buttons
const buttons = document.querySelectorAll("button, .btn-primary, .btn-secondary")
buttons.forEach((button) => {
  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span")
    const rect = this.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    ripple.style.width = ripple.style.height = size + "px"
    ripple.style.left = x + "px"
    ripple.style.top = y + "px"
    ripple.classList.add("ripple")

    this.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)
  })
})

// Add CSS for ripple effect dynamically
const style = document.createElement("style")
style.textContent = `
    button, .btn-primary, .btn-secondary {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`
document.head.appendChild(style)

// Page Load Animation
window.addEventListener("load", () => {
  document.body.style.opacity = "0"
  document.body.style.transition = "opacity 0.5s ease-in"

  setTimeout(() => {
    document.body.style.opacity = "1"
  }, 100)
})

const spots = document.querySelectorAll('.hotspot');
let activeDesc = null;

spots.forEach((spot, index) => {
  spot.addEventListener('click', () => {
    const desc = document.getElementById(`desc${index + 1}`);

    // Ẩn phần mô tả đang hiển thị
    if (activeDesc && activeDesc !== desc) {
      activeDesc.style.display = 'none';
    }

    // Hiện/ẩn phần mô tả tương ứng
    if (desc.style.display === 'block') {
      desc.style.display = 'none';
      activeDesc = null;
    } else {
      desc.style.display = 'block';
      activeDesc = desc;

      // Lấy vị trí nút để định vị mô tả
      const rect = spot.getBoundingClientRect();
      const parentRect = spot.parentElement.getBoundingClientRect();
      const offsetX = rect.left - parentRect.left;
      const offsetY = rect.top - parentRect.top;

      // Nếu nút ở nửa trái => mô tả hiện bên phải, ngược lại hiện bên trái
      if (offsetX < parentRect.width / 2) {
        desc.style.left = `${offsetX -450}px`;
      } else {
        desc.style.left = `${offsetX + 200}px`;
      }
      desc.style.top = `${offsetY - 10}px`;
    }
  });
});
