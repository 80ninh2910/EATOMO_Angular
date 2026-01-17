document.addEventListener('DOMContentLoaded', function() {
    // Store selected items
    const selectedItems = {
        protein: null,
        carbs: null,
        side: null,
        sauce: null
    };

    // Store nutrition totals
    const nutritionTotals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    // Get all option elements
    const options = document.querySelectorAll('.option');
    
    // Add click event to all options
    options.forEach(option => {
        option.addEventListener('click', function() {
            const category = this.dataset.category;
            const name = this.dataset.name;
            const calories = parseInt(this.dataset.calories);
            const protein = parseInt(this.dataset.protein);
            const carbs = parseInt(this.dataset.carbs);
            const fat = parseInt(this.dataset.fat);
            
            // Remove selected class from other options in the same category
            document.querySelectorAll(`.option[data-category="${category}"]`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to this option
            this.classList.add('selected');
            
            // Update selected items
            if (selectedItems[category]) {
                // Subtract previous item's nutrition values
                nutritionTotals.calories -= selectedItems[category].calories;
                nutritionTotals.protein -= selectedItems[category].protein;
                nutritionTotals.carbs -= selectedItems[category].carbs;
                nutritionTotals.fat -= selectedItems[category].fat;
            }
            
            // Store new selection
            selectedItems[category] = {
                name: name,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat
            };
            
            // Add new item's nutrition values
            nutritionTotals.calories += calories;
            nutritionTotals.protein += protein;
            nutritionTotals.carbs += carbs;
            nutritionTotals.fat += fat;
            
            // Update UI
            updateUI();
        });
    });
    
    // Clear selections button
    document.getElementById('clear-selections').addEventListener('click', function() {
        // Clear selected items
        for (let key in selectedItems) {
            selectedItems[key] = null;
        }
        
        // Reset nutrition totals
        nutritionTotals.calories = 0;
        nutritionTotals.protein = 0;
        nutritionTotals.carbs = 0;
        nutritionTotals.fat = 0;
        
        // Remove selected class from all options
        options.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Update UI
        updateUI();
    });
    
    // Download recipe button
    document.getElementById('download-recipe').addEventListener('click', function() {
        // Check if all items are selected
        if (!selectedItems.protein || !selectedItems.carbs || !selectedItems.side || !selectedItems.sauce) {
            alert('Please select all items before downloading your recipe!');
            return;
        }
        
        // Create recipe text
        const recipeText = `
            Your Soumaki Bowl Recipe
            
            Protein: ${selectedItems.protein.name}
            Carbs: ${selectedItems.carbs.name}
            Side: ${selectedItems.side.name}
            Sauce: ${selectedItems.sauce.name}
            
            Nutrition Information:
            Calories: ${nutritionTotals.calories}
            Protein: ${nutritionTotals.protein}g
            Carbs: ${nutritionTotals.carbs}g
            Fat: ${nutritionTotals.fat}g
            
            Enjoy your healthy bowl!
        `;
        
        // Create download link
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(recipeText));
        element.setAttribute('download', 'my-soumaki-bowl-recipe.txt');
        
        element.style.display = 'none';
        document.body.appendChild(element);
        
        element.click();
        
        document.body.removeChild(element);
    });
    
    // Function to update UI
    function updateUI() {
        // Update nutrition info
        document.getElementById('calories-count').textContent = nutritionTotals.calories;
        document.getElementById('protein-count').textContent = nutritionTotals.protein;
        document.getElementById('carbs-count').textContent = nutritionTotals.carbs;
        document.getElementById('fat-count').textContent = nutritionTotals.fat;
        
        // Update summary nutrition
        document.getElementById('summary-calories').textContent = nutritionTotals.calories;
        document.getElementById('summary-protein').textContent = nutritionTotals.protein;
        document.getElementById('summary-carbs').textContent = nutritionTotals.carbs;
        document.getElementById('summary-fat').textContent = nutritionTotals.fat;
        
        // Update selected items display
        updateSelectedItemDisplay('protein');
        updateSelectedItemDisplay('carbs');
        updateSelectedItemDisplay('side');
        updateSelectedItemDisplay('sauce');
    }
    
    // Function to update selected item display
    function updateSelectedItemDisplay(category) {
        const element = document.getElementById(`selected-${category}`);
        const item = selectedItems[category];
        
        if (item) {
            element.querySelector('h4 span').textContent = item.calories;
            element.querySelector('p').textContent = item.name;
        } else {
            element.querySelector('h4 span').textContent = '0';
            element.querySelector('p').textContent = `Select a ${category}`;
        }
    }
});document.addEventListener('DOMContentLoaded', function() {
    // Store selected items
    const selectedItems = {
        protein: null,
        carbs: null,
        side: null,
        sauce: null
    };

    // Store nutrition totals
    const nutritionTotals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    // Get all option elements
    const options = document.querySelectorAll('.option');
    
    // Add click event to all options
    options.forEach(option => {
        option.addEventListener('click', function() {
            const category = this.dataset.category;
            const name = this.dataset.name;
            const calories = parseInt(this.dataset.calories);
            const protein = parseInt(this.dataset.protein);
            const carbs = parseInt(this.dataset.carbs);
            const fat = parseInt(this.dataset.fat);
            
            // Remove selected class from other options in the same category
            document.querySelectorAll(`.option[data-category="${category}"]`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to this option
            this.classList.add('selected');
            
            // Update selected items
            if (selectedItems[category]) {
                // Subtract previous item's nutrition values
                nutritionTotals.calories -= selectedItems[category].calories;
                nutritionTotals.protein -= selectedItems[category].protein;
                nutritionTotals.carbs -= selectedItems[category].carbs;
                nutritionTotals.fat -= selectedItems[category].fat;
            }
            
            // Store new selection
            selectedItems[category] = {
                name: name,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat
            };
            
            // Add new item's nutrition values
            nutritionTotals.calories += calories;
            nutritionTotals.protein += protein;
            nutritionTotals.carbs += carbs;
            nutritionTotals.fat += fat;
            
            // Update UI
            updateUI();
        });
    });
    
    // Clear selections button
    document.getElementById('clear-selections').addEventListener('click', function() {
        // Clear selected items
        for (let key in selectedItems) {
            selectedItems[key] = null;
        }
        
        // Reset nutrition totals
        nutritionTotals.calories = 0;
        nutritionTotals.protein = 0;
        nutritionTotals.carbs = 0;
        nutritionTotals.fat = 0;
        
        // Remove selected class from all options
        options.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Update UI
        updateUI();
    });
    
    // Download recipe button
    document.getElementById('download-recipe').addEventListener('click', function() {
        // Check if all items are selected
        if (!selectedItems.protein || !selectedItems.carbs || !selectedItems.side || !selectedItems.sauce) {
            alert('Please select all items before downloading your recipe!');
            return;
        }
        
        // Create recipe text
        const recipeText = `
            Your Soumaki Bowl Recipe
            
            Protein: ${selectedItems.protein.name}
            Carbs: ${selectedItems.carbs.name}
            Side: ${selectedItems.side.name}
            Sauce: ${selectedItems.sauce.name}
            
            Nutrition Information:
            Calories: ${nutritionTotals.calories}
            Protein: ${nutritionTotals.protein}g
            Carbs: ${nutritionTotals.carbs}g
            Fat: ${nutritionTotals.fat}g
            
            Enjoy your healthy bowl!
        `;
        
        // Create download link
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(recipeText));
        element.setAttribute('download', 'my-soumaki-bowl-recipe.txt');
        
        element.style.display = 'none';
        document.body.appendChild(element);
        
        element.click();
        
        document.body.removeChild(element);
    });
    
    // Function to update UI
    function updateUI() {
        // Update nutrition info
        document.getElementById('calories-count').textContent = nutritionTotals.calories;
        document.getElementById('protein-count').textContent = nutritionTotals.protein;
        document.getElementById('carbs-count').textContent = nutritionTotals.carbs;
        document.getElementById('fat-count').textContent = nutritionTotals.fat;
        
        // Update summary nutrition
        document.getElementById('summary-calories').textContent = nutritionTotals.calories;
        document.getElementById('summary-protein').textContent = nutritionTotals.protein;
        document.getElementById('summary-carbs').textContent = nutritionTotals.carbs;
        document.getElementById('summary-fat').textContent = nutritionTotals.fat;
        
        // Update selected items display
        updateSelectedItemDisplay('protein');
        updateSelectedItemDisplay('carbs');
        updateSelectedItemDisplay('side');
        updateSelectedItemDisplay('sauce');
    }
    
    // Function to update selected item display
    function updateSelectedItemDisplay(category) {
        const element = document.getElementById(`selected-${category}`);
        const item = selectedItems[category];
        
        if (item) {
            element.querySelector('h4 span').textContent = item.calories;
            element.querySelector('p').textContent = item.name;
        } else {
            element.querySelector('h4 span').textContent = '0';
            element.querySelector('p').textContent = `Select a ${category}`;
        }
    }
});