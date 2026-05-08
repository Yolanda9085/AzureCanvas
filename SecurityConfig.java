package org.neonangellock.azurecanvas.config;

import org.neonangellock.azurecanvas.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder auth = http.getSharedObject(AuthenticationManagerBuilder.class);
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
        return auth.build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers(("/api/auth/**"))
                        .ignoringRequestMatchers(("/api/market/**"))
                        .ignoringRequestMatchers(("/api/messages/**"))
                        .ignoringRequestMatchers(("/api/orders/**"))
                        .ignoringRequestMatchers(("/api/storymaps/**"))
                        .ignoringRequestMatchers(("/api/posts/**"))
                        .ignoringRequestMatchers("/api/users/**")
                        .ignoringRequestMatchers("/api/v1/images/**")
                        .ignoringRequestMatchers("/api/treeholes/**")
                        .csrfTokenRepository(new CookieCsrfTokenRepository())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/**", "/css/**", "/js/**", "/images/**", "/cube/**", "/api/robots/**", "/admin/**", "/auth/**", "/forum/**", "/waterfall/**", "/models/**", "/textures/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}
