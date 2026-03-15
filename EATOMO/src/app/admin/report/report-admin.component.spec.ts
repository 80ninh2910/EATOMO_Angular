import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReportAdminComponent } from './report-admin.component';

describe('ReportAdminComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportAdminComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReportAdminComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
