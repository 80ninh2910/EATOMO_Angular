import { TestBed } from '@angular/core/testing';
import { ReportAdminComponent } from './report-admin.component';

describe('ReportAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportAdminComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReportAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
