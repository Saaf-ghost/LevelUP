package com.boostup.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange:boostup.ai.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.queue:boostup.pdf.jobs}")
    private String queue;

    @Value("${app.rabbitmq.routing-key:pdf.job.process}")
    private String routingKey;

    @Value("${app.rabbitmq.dlx:boostup.ai.dlx}")
    private String dlxExchange;

    @Value("${app.rabbitmq.dlq:boostup.pdf.jobs.dlq}")
    private String dlqQueue;

    @Value("${app.rabbitmq.dlq-routing-key:pdf.job.dlq}")
    private String dlqRoutingKey;

    @Bean
    public DirectExchange aiExchange() {
        return new DirectExchange(exchange, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(dlxExchange, true, false);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(dlqQueue).build();
    }

    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange()).with(dlqRoutingKey);
    }

    @Bean
    public Queue mainJobQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", dlxExchange);
        args.put("x-dead-letter-routing-key", dlqRoutingKey);
        return QueueBuilder.durable(queue).withArguments(args).build();
    }

    @Bean
    public Binding mainJobBinding() {
        return BindingBuilder.bind(mainJobQueue()).to(aiExchange()).with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}

