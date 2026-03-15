import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderAdminComponent } from './order-admin.component';

describe('OrderAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderAdminComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(OrderAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
