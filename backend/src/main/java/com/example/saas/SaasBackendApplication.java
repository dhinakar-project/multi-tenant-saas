package com.example.saas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SaasBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SaasBackendApplication.class, args);
	}

}
