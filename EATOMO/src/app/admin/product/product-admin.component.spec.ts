import { TestBed } from '@angular/core/testing';
import { ProductAdminComponent } from './product-admin.component';

describe('ProductAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAdminComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProductAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
