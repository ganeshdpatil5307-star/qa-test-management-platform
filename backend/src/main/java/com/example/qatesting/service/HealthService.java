package com.example.qatesting.service;

import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public String status() {
        return "UP";
    }
}
