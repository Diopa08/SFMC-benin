# ── Étape 1 : Compilation Maven ───────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Cache Maven persistant + retry automatique si coupure réseau
RUN --mount=type=cache,target=/root/.m2 \
    for i in 1 2 3 4 5; do \
      mvn package -DskipTests -q && break || \
      (echo "=== Tentative $i échouée, retry dans 10s ===" && sleep 10); \
    done

# ── Étape 2 : Image JRE légère ────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
