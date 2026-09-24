package com.example.qatesting.dto;

import com.example.qatesting.entity.Role;

public record AuthResponse(String token, String username, Role role) {
}
