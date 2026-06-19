package com.ehtp.kanban_backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.List;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class Application {

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(Application.class, args);
	}

	private static void loadDotenv() {
		for (String directory : List.of(".", "..")) {
			Dotenv dotenv = Dotenv.configure()
					.directory(directory)
					.ignoreIfMissing()
					.ignoreIfMalformed()
					.load();

			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		}
	}

}
