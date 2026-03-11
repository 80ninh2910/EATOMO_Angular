import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BowlService } from '../../services/bowl.service';
import { Bowl } from '../../models/bowl.model';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface ProductForm {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'low-cal' | 'balanced' | 'high-protein' | 'vegetarian';
  image: string;
  inStock: boolean;
  isFeatured: boolean;
}

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

  private cdr = inject(ChangeDetectorRef);

  showModal = false;
  editMode = false;
  modalTitle = '';
  editingId = '';
  form: ProductForm = this.emptyForm();

  constructor(private bowlService: BowlService) {}

  private emptyForm(): ProductForm {
    return { id: '', name: '', description: '', price: 0, calories: 0, protein: 0, carbs: 0, fat: 0, category: 'balanced', image: '', inStock: true, isFeatured: false };
  }

  ngOnInit(): void {
    this.bowlService.getBowls().subscribe((bowls) => {
      this.products = bowls.map((bowl, index) => this.mapBowlToProduct(bowl, index));
      this.selectedProduct = this.products[0] ?? null;
      this.isLoading = false;
      this.cdr.markForCheck();
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

  bulkDelete(): void {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Xóa ${this.selectedIds.size} sản phẩm?`)) return;
    const ids = Array.from(this.selectedIds);
    let completed = 0;
    ids.forEach(id => {
      this.bowlService.deleteBowl(id).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.products = this.products.filter(p => !this.selectedIds.has(p.id));
            this.selectedIds.clear();
            this.selectedProduct = this.products[0] ?? null;
            this.currentPage = 1;
            this.cdr.markForCheck();
          }
        },
        error: () => completed++
      });
    });
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

  createProduct(): void {
    this.editMode = false;
    this.editingId = '';
    this.form = this.emptyForm();
    this.modalTitle = 'Create product';
    this.showModal = true;
  }

  editProduct(): void {
    if (!this.selectedProduct) return;
    this.editMode = true;
    this.editingId = this.selectedProduct.id;
    const p = this.selectedProduct;
    this.form = {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.priceValue,
      calories: p.caloriesValue,
      protein: p.proteinValue,
      carbs: Number(p.carbs),
      fat: Number(p.fat),
      category: this.reverseCategoryLabel(p.category),
      image: p.image,
      inStock: p.status !== 'archive',
      isFeatured: false
    };
    this.modalTitle = 'Edit product';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveModal(): void {
    if (this.editMode) {
      this.bowlService.updateBowl(this.editingId, {
        name: this.form.name,
        description: this.form.description,
        price: this.form.price,
        calories: this.form.calories,
        protein: this.form.protein,
        carbs: this.form.carbs,
        fat: this.form.fat,
        category: this.form.category,
        image: this.form.image,
        inStock: this.form.inStock,
        isFeatured: this.form.isFeatured
      }).subscribe({
        next: (bowl) => {
          const idx = this.products.findIndex(p => p.id === this.editingId);
          if (idx >= 0) {
            this.products[idx] = this.mapBowlToProduct(bowl, idx);
            this.selectedProduct = this.products[idx];
          }
          this.showModal = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          alert('Cập nhật sản phẩm thất bại.');
        }
      });
    } else {
      this.bowlService.createBowl(this.form).subscribe({
        next: (bowl) => {
          this.products = [...this.products, this.mapBowlToProduct(bowl, this.products.length)];
          this.selectedProduct = this.products[this.products.length - 1];
          this.showModal = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          alert('Tạo sản phẩm thất bại.');
        }
      });
    }
  }

  addFilterCondition() {
    this.toggleFilters();
  }

  deleteProduct(): void {
    if (!this.selectedProduct) return;
    if (!confirm(`Xóa sản phẩm "${this.selectedProduct.name}"?`)) return;
    const id = this.selectedProduct.id;
    this.bowlService.deleteBowl(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== id);
        this.selectedProduct = this.products[0] ?? null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        alert('Xóa sản phẩm thất bại.');
      }
    });
  }

  addImage(): void {
    alert('Tính năng upload ảnh sẽ được thêm sau.');
  }

  updateProduct(): void {
    this.editProduct();
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
      case 'low-cal': return 'Low calories';
      case 'balanced': return 'Balanced';
      case 'high-protein': return 'High protein';
      case 'vegetarian': return 'Vegetarian';
      default: return 'Our Bowls';
    }
  }

  private reverseCategoryLabel(label: string): 'low-cal' | 'balanced' | 'high-protein' | 'vegetarian' {
    switch (label) {
      case 'Low calories': return 'low-cal';
      case 'High protein': return 'high-protein';
      case 'Vegetarian': return 'vegetarian';
      default: return 'balanced';
    }
  }
}
