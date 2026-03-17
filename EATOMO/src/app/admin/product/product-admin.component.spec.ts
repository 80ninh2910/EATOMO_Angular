import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductAdminComponent } from './product-admin.component';

describe('ProductAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAdminComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProductAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
