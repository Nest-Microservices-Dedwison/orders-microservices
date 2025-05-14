// import { OrderStatus } from "@prisma/client";
import { ArrayMinSize, IsArray,/* IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive,*/ ValidateNested } from "class-validator";
// import { OrderStatusList } from "../enum/order.enum";
import { OrderItemDto } from "./order-item.dto";
import { Type } from "class-transformer";

export class CreateOrderDto {

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type( () => OrderItemDto )
    items: OrderItemDto[]

    /*@IsNumber()
    @IsPositive()
    totalAmount: number;

    @IsNumber()
    @IsPositive()
    totalItems: number;

    @IsEnum( OrderStatusList , {
        message: `Possible status are ${ OrderStatusList }`
    })
    @IsOptional()
    status: OrderStatus = OrderStatus.PENDING;

    @IsBoolean()
    @IsOptional()
    paid: boolean = false;*/

}

