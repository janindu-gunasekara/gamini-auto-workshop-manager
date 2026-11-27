
package com.gaminiauto.workshopmanager.repository;

import com.gaminiauto.workshopmanager.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}
