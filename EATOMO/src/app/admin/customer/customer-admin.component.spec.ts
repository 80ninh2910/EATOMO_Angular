import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CustomerAdminComponent } from './customer-admin.component';

describe('CustomerAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerAdminComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CustomerAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
