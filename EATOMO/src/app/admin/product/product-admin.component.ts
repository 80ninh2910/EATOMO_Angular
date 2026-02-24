import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BowlService } from '../../services/bowl.service';
import { Bowl } from '../../models/bowl.model';
import { RouterLink, RouterLinkActive } from '@angular/router';

type ProductStatus = 'active' | 'draft' | 'archive';

interface ProductItem {
  id: string;
  name: string;
  meta: string;
  category: string;
  group: string;
  price: string;
  priceValue: number;
  status: ProductStatus;
  statusLabel: string;
  protein: string;
  carbs: string;
  fat: string;
  caloriesValue: number;
  proteinValue: number;
  updatedAt: string;
  updatedBy: string;
  description: string;
  image: string;
  gallery: string[];
}

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './product-admin.component.html',
  styleUrl: './product-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductAdminComponent implements OnInit {
  products: ProductItem[] = [];
  isLoading = true;

  activeTab: 'all' | 'active' | 'draft' | 'archive' = 'all';
  viewMode: 'grid' | 'list' = 'list';
  selectedProduct: ProductItem | null = null;
  searchValue = '';
  appliedSearch = '';
  showFilters = false;
  filterStatus: 'all' | ProductStatus = 'all';
  filterCategory = 'all';
  minPrice = '';
  maxPrice = '';
  minCalories = '';
  maxCalories = '';
  minProtein = '';
  maxProtein = '';
  pageSize = 10;
  currentPage = 1;
  selectedIds = new Set<string>();

  constructor(private bowlService: BowlService) {}

  ngOnInit(): void {
    this.bowlService.getBowls().subscribe((bowls) => {
      this.products = bowls.map((bowl, index) => this.mapBowlToProduct(bowl, index));
      this.selectedProduct = this.products[0] ?? null;
      this.isLoading = false;
    });
  }

  get filteredProducts() {
    return this.products.filter((product) => {
      if (this.activeTab !== 'all' && product.status !== this.activeTab) {
        return false;
      }

      if (this.filterStatus !== 'all' && product.status !== this.filterStatus) {
        return false;
      }

      if (this.filterCategory !== 'all' && product.category !== this.filterCategory) {
        return false;
      }

      if (!this.appliedSearch) {
        return this.passesNumericFilters(product);
      }

      const haystack = `${product.name} ${product.category} ${product.group}`.toLowerCase();
      return haystack.includes(this.appliedSearch) && this.passesNumericFilters(product);
    });
  }

  get totalProducts() {
    return this.products.length;
  }

  get pagedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  get pageStart() {
    if (this.filteredProducts.length === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd() {
    return Math.min(this.currentPage * this.pageSize, this.filteredProducts.length);
  }

  setActiveTab(tab: 'all' | 'active' | 'draft' | 'archive') {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value.toLowerCase();
  }

  applyFilters() {
    this.appliedSearch = this.searchValue.trim();
    this.currentPage = 1;
  }

  selectProduct(product: ProductItem) {
    this.selectedProduct = product;
  }

  trackById(_: number, product: ProductItem) {
    return product.id;
  }

  toggleSelectAll(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.pagedProducts.forEach((product) => this.selectedIds.add(product.id));
    } else {
      this.pagedProducts.forEach((product) => this.selectedIds.delete(product.id));
    }
  }

  toggleSelectProduct(productId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedIds.add(productId);
    } else {
      this.selectedIds.delete(productId);
    }
  }

  isSelected(productId: string) {
    return this.selectedIds.has(productId);
  }

  isAllSelected() {
    return this.pagedProducts.length > 0 && this.pagedProducts.every((product) => this.selectedIds.has(product.id));
  }

  changePage(page: number) {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.filterStatus = 'all';
    this.filterCategory = 'all';
    this.minPrice = '';
    this.maxPrice = '';
    this.minCalories = '';
    this.maxCalories = '';
    this.minProtein = '';
    this.maxProtein = '';
    this.appliedSearch = '';
    this.searchValue = '';
    this.currentPage = 1;
  }

  updateStatus(product: ProductItem, status: ProductStatus | string) {
    const nextStatus = status as ProductStatus;
    product.status = nextStatus;
    product.statusLabel = this.getStatusLabel(nextStatus);
    product.updatedAt = this.getNowLabel();
    product.updatedBy = 'Admin';
  }

  updatePrice(product: ProductItem, event: Event) {
    const target = event.target as HTMLInputElement;
    const nextValue = Number(target.value || 0);
    product.priceValue = nextValue;
    product.price = this.formatPrice(nextValue);
    product.updatedAt = this.getNowLabel();
    product.updatedBy = 'Admin';
  }

  bulkArchive() {
    if (this.selectedIds.size === 0) {
      return;
    }
    this.products.forEach((product) => {
      if (this.selectedIds.has(product.id)) {
        this.updateStatus(product, 'archive');
      }
    });
    alert(`Archived ${this.selectedIds.size} products`);
  }

  bulkDelete() {
    if (this.selectedIds.size === 0) {
      return;
    }
    this.products = this.products.filter((product) => !this.selectedIds.has(product.id));
    this.selectedIds.clear();
    this.currentPage = 1;
    alert('Deleted selected products');
  }

  exportSelected() {
    if (this.selectedIds.size === 0) {
      return;
    }
    alert(`Export ${this.selectedIds.size} products`);
  }

  importData() {
    alert('Import product data');
  }

  exportData() {
    alert('Export product data');
  }

  createProduct() {
    alert('Create new product');
  }

  addFilterCondition() {
    this.toggleFilters();
  }

  deleteProduct() {
    if (this.selectedProduct) {
      alert(`Delete product: ${this.selectedProduct.name}`);
    }
  }

  addImage() {
    if (this.selectedProduct) {
      alert(`Add image for: ${this.selectedProduct.name}`);
    }
  }

  updateProduct() {
    if (this.selectedProduct) {
      alert(`Update product: ${this.selectedProduct.name}`);
    }
  }

  private mapBowlToProduct(bowl: Bowl, index: number): ProductItem {
    const status: ProductStatus = bowl.inStock === false ? 'archive' : index % 5 === 0 ? 'draft' : 'active';
    const updatedBy = ['Admin', 'Manager', 'Staff'][index % 3];
    return {
      id: bowl.id,
      name: bowl.name,
      meta: `${bowl.calories} kcal`,
      category: this.getCategoryLabel(bowl.category),
      group: 'Our Bowls',
      price: this.formatPrice(bowl.price),
      priceValue: bowl.price,
      status,
      statusLabel: this.getStatusLabel(status),
      protein: `${bowl.protein} g`,
      carbs: `${bowl.carbs} g`,
      fat: `${bowl.fat} g`,
      caloriesValue: bowl.calories,
      proteinValue: bowl.protein,
      updatedAt: this.getUpdatedAt(index),
      updatedBy,
      description: bowl.description,
      image: bowl.image,
      gallery: [bowl.image]
    };
  }

  private formatPrice(price: number) {
    return `${price.toLocaleString('vi-VN')} ₫`;
  }

  private getStatusLabel(status: ProductStatus) {
    switch (status) {
      case 'active':
        return 'On sale';
      case 'draft':
        return 'Draft';
      default:
        return 'Archived';
    }
  }

  private passesNumericFilters(product: ProductItem) {
    const minPrice = Number(this.minPrice || 0);
    const maxPrice = Number(this.maxPrice || 0);
    const minCalories = Number(this.minCalories || 0);
    const maxCalories = Number(this.maxCalories || 0);
    const minProtein = Number(this.minProtein || 0);
    const maxProtein = Number(this.maxProtein || 0);

    if (minPrice && product.priceValue < minPrice) return false;
    if (maxPrice && product.priceValue > maxPrice) return false;
    if (minCalories && product.caloriesValue < minCalories) return false;
    if (maxCalories && product.caloriesValue > maxCalories) return false;
    if (minProtein && product.proteinValue < minProtein) return false;
    if (maxProtein && product.proteinValue > maxProtein) return false;

    return true;
  }

  private getUpdatedAt(index: number) {
    const day = 10 + (index % 10);
    const hour = 9 + (index % 9);
    const minute = index % 2 === 0 ? '05' : '30';
    return `${day}/10/2025 ${hour}:${minute}`;
  }

  private getNowLabel() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  private getCategoryLabel(category: Bowl['category']) {
    switch (category) {
      case 'low-cal':
        return 'Low calories';
      case 'balanced':
        return 'Balanced';
      case 'high-protein':
        return 'High protein';
      case 'vegetarian':
        return 'Vegetarian';
      default:
        return 'Our Bowls';
    }
  }
}
