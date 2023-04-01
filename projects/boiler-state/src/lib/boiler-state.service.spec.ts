import { TestBed } from '@angular/core/testing';

import { BoilerStateService } from './boiler-state.service';

describe('BoilerStateService', () => {
  let service: BoilerStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoilerStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
