(() => {
  const stepColors = {
    1: "#FF6B6B",
    2: "#4ECDC4",
    3: "#95E1D3",
    4: "#F38181"
  };

  document.addEventListener("DOMContentLoaded", () => {
    wireBackToTop();
    wireMenuToggle();
    setupHeaderScroll();
    setupFilterTabs();
    setupStepCards();
    setupSmoothAnchors();
    setupSectionObserver();
    setupBowlObserver();
    setupDownloadRecipe();
    setupStepLinks();
    setupExperienceParallax();
    setupLazyImages();
    loadReviews();
  });

  function wireBackToTop() {
    const trigger = document.getElementById("backToTop");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function wireMenuToggle() {
    const menuToggle = document.getElementById("menuToggle");
    const nav = document.querySelector(".nav");
    if (!menuToggle || !nav) return;

    menuToggle.addEventListener("click", () => {
      nav.classList.toggle("active");
      const spans = menuToggle.querySelectorAll("span");
      if (nav.classList.contains("active")) {
        spans[0].style.transform = "rotate(45deg) translateY(10px)";
        spans[1].style.opacity = "0";
        spans[2].style.transform = "rotate(-45deg) translateY(-10px)";
      } else {
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      }
    });
  }

  function setupHeaderScroll() {
    const header = document.querySelector(".header");
    if (!header) return;
    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 100) {
        header.style.padding = "10px 0";
        header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.15)";
      } else {
        header.style.padding = "20px 0";
        header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
      }
    });
  }

  function setupFilterTabs() {
    const filterTabs = document.querySelectorAll(".filter-tab");
    const bowlCards = document.querySelectorAll(".bowl-card");
    if (!filterTabs.length || !bowlCards.length) return;

    filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tab.style.transform = "scale(0.95)";
        setTimeout(() => {
          tab.style.transform = "";
        }, 150);

        filterTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const filterValue = tab.getAttribute("data-filter");
        bowlCards.forEach((card, index) => {
          if (filterValue === "all" || card.getAttribute("data-category") === filterValue) {
            card.style.display = "block";
            setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "translateY(0) scale(1)";
              card.classList.add("animate-bounce-in");
            }, index * 100);
          } else {
            card.style.opacity = "0";
            card.style.transform = "translateY(20px) scale(0.8)";
            card.classList.remove("animate-bounce-in");
            setTimeout(() => {
              card.style.display = "none";
            }, 300);
          }
        });
      });
    });
  }

  function setupStepCards() {
    document.querySelectorAll(".step-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const stepNumber = card.getAttribute("data-step");
        card.style.backgroundColor = stepColors[stepNumber] || "#4CAF50";
        card.querySelector(".step-title").style.color = "#fff";
        card.querySelector(".step-content h4").style.color = "#fff";
        card.querySelector(".step-content p").style.color = "rgba(255, 255, 255, 0.9)";
        card.querySelector(".step-link").style.color = "#fff";
      });

      card.addEventListener("mouseleave", () => {
        card.style.backgroundColor = "#fff";
        card.querySelector(".step-title").style.color = "#1A1A1A";
        card.querySelector(".step-content h4").style.color = "#1A1A1A";
        card.querySelector(".step-content p").style.color = "#666666";
        card.querySelector(".step-link").style.color = "#4CAF50";
      });
    });
  }

  function setupSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function setupSectionObserver() {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            entry.target.classList.add("animate-slide-up");
          }, index * 100);
        }
      });
    }, observerOptions);

    document.querySelectorAll("section").forEach((section) => {
      section.style.opacity = "0";
      section.style.transform = "translateY(50px)";
      section.style.transition =
        "opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      observer.observe(section);
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll(".animate-slide-left, .animate-slide-right").forEach((el) => {
      revealObserver.observe(el);
    });
  }

  function setupBowlObserver() {
    const bowlCards = document.querySelectorAll(".bowl-card");
    if (!bowlCards.length) return;

    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const bowlObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0) scale(1)";
            entry.target.classList.add("animate-bounce-in");
          }, index * 150);
        }
      });
    }, observerOptions);

    bowlCards.forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(50px) scale(0.9)";
      card.style.transition =
        "opacity 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      bowlObserver.observe(card);
    });
  }

  function setupDownloadRecipe() {
    document.querySelectorAll(".download-recipe").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const bowlCard = button.closest(".bowl-card");
        if (!bowlCard) return;
        const bowlName = bowlCard.querySelector(".bowl-name")?.textContent || "Bowl";
        const bowlDescription = bowlCard.querySelector(".bowl-description")?.textContent || "";
        const calories = bowlCard.querySelector(".calories-badge")?.textContent || "";

        const recipeInfo =
          `${bowlName} recipe\n\n` +
          `Ingredients:\n${bowlDescription}\n\n` +
          `Nutrition:\n${calories}\n\n` +
          `Instructions:\n` +
          `1. Prepare ingredients fresh.\n` +
          `2. Cook protein (sous-vide or grill) until tender.\n` +
          `3. Steam vegetables until just soft.\n` +
          `4. Cook carbs per package directions.\n` +
          `5. Assemble the bowl and finish with sauce.`;

        alert(recipeInfo);
      });
    });
  }

  function setupStepLinks() {
    document.querySelectorAll(".step-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const stepCard = link.closest(".step-card");
        const stepTitle = stepCard?.querySelector(".step-title")?.textContent || "";
        showStepDetails(stepTitle);
      });
    });
  }

  function setupExperienceParallax() {
    document.querySelectorAll(".experience-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
      });
    });
  }

  function setupLazyImages() {
    if (!("IntersectionObserver" in window)) return;
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove("loading");
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll("img").forEach((img) => {
      img.classList.add("loading");
      imageObserver.observe(img);
    });
  }

  function navigateToPage(page, event) {
    if (event) event.preventDefault();
    switch (page) {
      case "about":
        window.location.href = "/about-us";
        break;
      case "bowls":
        window.location.href = "/our-bowls";
        break;
      case "stores":
        window.location.href = "/stores";
        break;
      case "delivery":
        window.location.href = "/orders";
        break;
      case "contact":
        window.location.href = "/faqs";
        break;
      case "calculator":
        openCaloriesCalculator();
        break;
      case "catering":
        window.location.href = "/orders";
        break;
      case "login":
        window.location.href = "/login";
        break;
      case "register":
        window.location.href = "/register";
        break;
      default:
        console.log(`No handler for ${page}`);
    }
    return false;
  }

  function findStore(event) {
    return navigateToPage("stores", event);
  }

  function orderNow(event) {
    if (event) event.preventDefault();
    showDeliveryOptions();
    return false;
  }

  function learnMoreCatering(event) {
    if (event) event.preventDefault();
    showCateringInfo();
    return false;
  }

  function showStoreLocations(event) {
    return navigateToPage("stores", event);
  }

  function showDeliveryOptions() {
    const deliveryInfo =
      "Delivery options:\n" +
      "- Available on Grab Food, Now (Foody), Baemin\n" +
      "- Hours: 10AM - 9PM daily\n" +
      "- Hotline: 0326238700\n\n" +
      "Tip: Order through your favorite app for the best experience.";
    alert(deliveryInfo);
    return false;
  }

  function showCateringInfo() {
    const cateringInfo =
      "Eatomo catering services:\n" +
      "- Perfect for corporate events, team meetings, private parties\n" +
      "- Custom bowl selections, bulk orders, dietary accommodations\n" +
      "- Contact: 0326238700 | info@soumaki.com.vn\n" +
      "- Minimum order: 20 bowls | Please order 48 hours ahead";
    alert(cateringInfo);
    return false;
  }

  function openCaloriesCalculator() {
    const calculatorInfo =
      "Calories calculator:\n" +
      "1) Choose protein\n" +
      "2) Select carbs\n" +
      "3) Pick vegetables\n" +
      "4) Add sauce\n" +
      "5) Get instant calorie count\n\n" +
      "Online version: soumaki.com.vn/calculator";
    alert(calculatorInfo);
    return false;
  }

  function calculateCalories(event) {
    if (event) event.preventDefault();
    openCaloriesCalculator();
    return false;
  }

  function showStepDetails(stepType) {
    let stepInfo = "";
    switch (stepType) {
      case "Protein":
        stepInfo =
          "Protein options:\n" +
          "- Beef steak, grilled chicken, salmon, tuna, duck breast, prawns, basa fish\n" +
          "- Cooked sous-vide for tenderness and flavor\n" +
          "- Packed with protein, iron, and B vitamins.";
        break;
      case "Carbs":
        stepInfo =
          "Carb options:\n" +
          "- Donburi brown/white rice, Japanese cold soba, pasta, quinoa, baby potato\n" +
          "- Great for sustained energy and balanced nutrition.";
        break;
      case "Side":
        stepInfo =
          "Veggie options:\n" +
          "- Broccoli, spinach, beetroot, French beans, mushrooms, pak choi, cauliflower, mixed greens\n" +
          "- Fresh daily, full of fiber, vitamins, and antioxidants.";
        break;
      case "Sauce":
        stepInfo =
          "Sauce options:\n" +
          "- Teriyaki, cilantro lime, spicy mayo, sesame ginger, sweet chili, pesto\n" +
          "- Swap sauces to discover new flavors every time.";
        break;
      default:
        stepInfo = "Pick a step to view details.";
    }
    alert(stepInfo);
    return false;
  }

  function scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function contactSoumaki() {
    const contactInfo =
      "Contact Eatomo:\n" +
      "- Phone: 0326238700\n" +
      "- Email: info@soumaki.com.vn\n" +
      "- Hours: 10AM - 9PM daily";
    alert(contactInfo);
    return false;
  }

  function openSocialMedia(platform) {
    const messages = {
      facebook: "Follow us on Facebook for new bowls, promotions, and tips.",
      instagram: "Follow us on Instagram for photos, behind-the-scenes, and stories.",
      tiktok: "Follow us on TikTok for cooking videos and healthy lifestyle content."
    };
    alert(messages[platform] || "Thanks for following Eatomo!");
    return false;
  }

  function readMoreNews() {
    const newsInfo =
      "Eatomo News:\n" +
      "- Official nutrition partner of VBA 3x3.EXE Super Premier 2025\n" +
      "- Supporting athletes with nutritious meals and recovery-friendly menus.";
    alert(newsInfo);
    return false;
  }

  function diveIntoStory() {
    const storyInfo =
      "Our story:\n" +
      "- Since 2020, your healthy food soulmate\n" +
      "- Fresh ingredients, sous-vide cooking, customizable nutrition\n" +
      "- Join our community for healthier, happier living.";
    alert(storyInfo);
    return false;
  }

  function showFAQs() {
    const faqInfo =
      "FAQs:\n" +
      "- What makes the bowls healthy? Fresh ingredients, sous-vide cooking, balanced macros.\n" +
      "- Opening hours? 10AM - 9PM daily.\n" +
      "- Do you deliver? Yes, via Grab, Now, and Baemin.\n" +
      "- Do you offer catering? Yes, contact us for details.\n" +
      "- Payment methods? Cash, card, and major digital wallets.\n" +
      "Need more help? Call 0326238700.";
    alert(faqInfo);
    return false;
  }

  function renderStars(count) {
    return "*".repeat(Math.max(0, count || 0));
  }

  function displayReviews(reviews) {
    const container = document.getElementById("reviews");
    if (!container || !Array.isArray(reviews)) return;
    container.innerHTML = "";
    reviews.forEach((r) => {
      const card = document.createElement("div");
      card.classList.add("review-card");
      card.innerHTML = `
        <div class="review-header">
          <h3>${r.name}</h3>
          <span>${r.date}</span>
        </div>
        <div class="stars">${renderStars(r.stars)}</div>
        <p>${r.content}</p>
        <p class="source">${r.source}</p>
      `;
      container.appendChild(card);
    });
  }

  function loadReviews() {
    fetch("/assets/healthy/json/reviews.json")
      .then((res) => {
        if (!res.ok) throw new Error("Cannot load reviews");
        return res.json();
      })
      .then((data) => displayReviews(data.reviews))
      .catch((err) => console.error(err));
  }

  window.navigateToPage = navigateToPage;
  window.findStore = findStore;
  window.orderNow = orderNow;
  window.learnMoreCatering = learnMoreCatering;
  window.showDeliveryOptions = showDeliveryOptions;
  window.showStoreLocations = showStoreLocations;
  window.showCateringInfo = showCateringInfo;
  window.openCaloriesCalculator = openCaloriesCalculator;
  window.calculateCalories = calculateCalories;
  window.showStepDetails = showStepDetails;
  window.contactSoumaki = contactSoumaki;
  window.openSocialMedia = openSocialMedia;
  window.readMoreNews = readMoreNews;
  window.diveIntoStory = diveIntoStory;
  window.showFAQs = showFAQs;
})();
