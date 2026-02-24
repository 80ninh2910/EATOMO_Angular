import { TestBed } from '@angular/core/testing';
import { PromotionAdminComponent } from './promotion-admin.component';

describe('PromotionAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromotionAdminComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PromotionAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
